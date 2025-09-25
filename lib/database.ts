import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Database utility functions
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message)
    this.name = "DatabaseError"
  }
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Generic database operations
export class DatabaseOperations {
  static async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      console.error("Database operation failed:", error)

      if (error.code === "23505") {
        throw new DatabaseError("Duplicate entry found", "DUPLICATE_ENTRY", error)
      }

      if (error.code === "23503") {
        throw new DatabaseError("Referenced record not found", "FOREIGN_KEY_VIOLATION", error)
      }

      if (error.code === "23502") {
        throw new DatabaseError("Required field is missing", "NOT_NULL_VIOLATION", error)
      }

      throw new DatabaseError("Database operation failed", "UNKNOWN_ERROR", error)
    }
  }

  static async paginate<T>(
    baseQuery: string,
    whereClause: string,
    params: any[],
    options: PaginationOptions & { isAdmin?: boolean } = {},
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page || 1)

    let limit: number
    if (options.isAdmin) {
      limit = options.limit || 100000
    } else {
      limit = Math.min(1000, Math.max(1, options.limit || 100))
    }

    const offset = (page - 1) * limit

    // Build the complete query with sorting and pagination
    let orderClause = ""
    if (options.sortBy) {
      const sortOrder = options.sortOrder === "desc" ? "DESC" : "ASC"
      orderClause = ` ORDER BY ${options.sortBy} ${sortOrder}`
    }

    try {
      const fromMatch = baseQuery.match(/FROM\s+(.+?)(?:\s+WHERE|$)/is)
      const fromClause = fromMatch ? fromMatch[1].trim() : "vendors v"

      // Build the data query with pagination
      const dataQuery = `${baseQuery} WHERE ${whereClause}${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      const countQuery = `SELECT COUNT(*) as count FROM ${fromClause} WHERE ${whereClause}`

      const dataResult = await sql.query(dataQuery, [...params, limit, offset])
      const countResult = await sql.query(countQuery, params)

      const total = Number.parseInt(countResult[0].count)
      const totalPages = Math.ceil(total / limit)

      return {
        data: dataResult as T[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      console.error("Pagination query failed:", error)
      throw new DatabaseError("Failed to execute paginated query", "QUERY_ERROR", error)
    }
  }

  private static async executeRawQuery<T>(query: string, params: any[]): Promise<T[]> {
    try {
      const result = await sql.query(query, params)
      return result as T[]
    } catch (error: any) {
      console.error("Raw query execution failed:", error)

      if (error.message && error.message.includes("JSON.parse")) {
        throw new DatabaseError("Invalid response format from database", "JSON_PARSE_ERROR", error)
      }

      throw error
    }
  }

  static async logActivity(
    userId: number,
    action: string,
    entityType: string,
    entityId: number,
    details?: any,
  ): Promise<void> {
    try {
      if (!userId || !action || !entityType || !entityId) {
        console.warn("Invalid parameters for activity logging:", { userId, action, entityType, entityId })
        return
      }

      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'activity_logs'
        )
      `

      if (!tableExists[0].exists) {
        console.warn("Activity logs table does not exist, skipping activity logging")
        return
      }

      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (${userId}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(details || {})}, NOW())
      `
    } catch (error: any) {
      console.warn("Failed to log activity (non-critical):", error.message)
    }
  }
}

// Vendor operations
export class VendorOperations {
  static async getAll(
    options: PaginationOptions & {
      search?: string
      location?: string
      tradeType?: string
      companyTag?: string
      userId?: string
      userRole?: string
      isAdmin?: boolean
      representative?: string
    } = {},
  ) {
    const whereConditions = ["1=1"]
    const params: any[] = []
    let paramIndex = 1

    if (options.search) {
      whereConditions.push(
        `(v.name ILIKE $${paramIndex} OR v.business_name ILIKE $${paramIndex} OR v.email ILIKE $${paramIndex})`,
      )
      params.push(`%${options.search}%`)
      paramIndex++
    }

    if (options.location) {
      whereConditions.push(`v.location ILIKE $${paramIndex}`)
      params.push(`%${options.location}%`)
      paramIndex++
    }

    if (options.tradeType) {
      whereConditions.push(`v.trade_type = $${paramIndex}`)
      params.push(options.tradeType)
      paramIndex++
    }

    if (options.companyTag) {
      whereConditions.push(`v.company_tag = $${paramIndex}`)
      params.push(options.companyTag)
      paramIndex++
    }

    if (!options.isAdmin && options.representative) {
      whereConditions.push(`(v.representative = $${paramIndex} OR v."Representative_2" = $${paramIndex})`)
      params.push(options.representative)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const baseQuery = `
      SELECT 
        v.id, v.name, v.phone, v.email, v.business_name, v.location, v.work_area,
        v.specialty, v.licensed, v.representative, v.trade_type, v.interested,
        v.followups_count, v.followups_completed, v.last_contact_date, v.created_at,
        v.password, v.notes, v.last_claim_date, v.claims_number,
        v.worked_with_pa_attorney, v.pa_attorney_type, v.is_independent_broker,
        v.sells_homeowners_insurance, v.sells_commercial_insurance,
        COALESCE(notes_count.count, 0) as notes_count,
        COALESCE(fees_count.count, 0) as fees_count,
        COALESCE(pricing_count.count, 0) as pricing_count
      FROM vendors v
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM vendor_notes 
        GROUP BY vendor_id
      ) notes_count ON v.id = notes_count.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM vendor_fees 
        GROUP BY vendor_id
      ) fees_count ON v.id = fees_count.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM vendor_pricing 
        GROUP BY vendor_id
      ) pricing_count ON v.id = pricing_count.vendor_id
    `

    return DatabaseOperations.paginate(baseQuery, whereClause, params, options)
  }

  static async create(data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        INSERT INTO vendors (
          name, phone, email, business_name, location, work_area,
          specialty, licensed, representative, trade_type, interested,
          notes, created_at, updated_at
        )
        VALUES (
          ${data.name}, ${data.phone}, ${data.email}, ${data.business_name}, 
          ${data.location}, ${data.work_area}, ${data.specialty}, ${data.licensed}, 
          ${data.representative}, ${data.trade_type}, ${data.interested},
          ${data.notes}, NOW(), NOW()
        )
        RETURNING *
      `

      await DatabaseOperations.logActivity(userId, "CREATE", "vendor", result[0].id, data)
      return result[0]
    })
  }

  static async update(id: number, data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const updateFields: string[] = []
      const updateValues: any[] = []
      let paramIndex = 1

      const allowedFields = [
        "name",
        "phone",
        "email",
        "business_name",
        "location",
        "work_area",
        "specialty",
        "licensed",
        "representative",
        "Representative_2", // Added Representative_2 field
        "trade_type",
        "interested",
        "notes",
        "worked_with_pa_attorney",
        "pa_attorney_type",
        "is_independent_broker",
        "sells_homeowners_insurance",
        "sells_commercial_insurance",
        "last_contact_date", // Added last_contact_date to allowed fields for vendor updates
      ]

      for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = $${paramIndex}`)
          updateValues.push(data[field])
          paramIndex++
        }
      }

      updateFields.push(`updated_at = NOW()`)

      if (updateFields.length === 1) {
        throw new DatabaseError("No valid fields provided for update", "INVALID_INPUT")
      }

      updateValues.push(id)
      const whereParamIndex = paramIndex

      const query = `
        UPDATE vendors 
        SET ${updateFields.join(", ")}
        WHERE id = $${whereParamIndex}
        RETURNING *
      `

      const result = await sql.query(query, updateValues)

      if (result.length === 0) {
        throw new DatabaseError("Vendor not found", "NOT_FOUND")
      }

      await DatabaseOperations.logActivity(userId, "UPDATE", "vendor", id, data)
      return result[0]
    })
  }

  static async delete(id: number, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        DELETE FROM vendors 
        WHERE id = ${id}
        RETURNING *
      `

      if (result.length === 0) {
        throw new DatabaseError("Vendor not found", "NOT_FOUND")
      }

      await DatabaseOperations.logActivity(userId, "DELETE", "vendor", id)
      return result[0]
    })
  }

  static async getUserVendorRelations() {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        SELECT 
          uvr.id,
          uvr.user_id,
          uvr.vendor_id,
          uvr.access_level,
          uvr.created_at,
          u.name as user_name,
          u.email as user_email,
          v.name as vendor_name,
          v.business_name as vendor_business_name
        FROM user_vendor_relations uvr
        LEFT JOIN users u ON uvr.user_id = u.id
        LEFT JOIN vendors v ON uvr.vendor_id = v.id
        ORDER BY u.name, v.name
      `
      return result
    })
  }

  static async updateUserVendorRelations(userId: number, vendorIds: number[]) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      await sql`
        DELETE FROM user_vendor_relations 
        WHERE user_id = ${userId}
      `

      if (vendorIds.length > 0) {
        for (const vendorId of vendorIds) {
          await sql`
            INSERT INTO user_vendor_relations (user_id, vendor_id, access_level) 
            VALUES (${userId}, ${vendorId}, 'read')
          `
        }
      }

      await DatabaseOperations.logActivity(1, "UPDATE_VENDOR_RELATIONS", "user", userId, { vendorIds })
      return { success: true, userId, vendorIds }
    })
  }
}

// Claims operations
export class ClaimsOperations {
  static async getAll(
    options: PaginationOptions & {
      search?: string
      status?: string
      source?: string
      companyTag?: string
    } = {},
  ) {
    const whereConditions = ["1=1"]
    const params: any[] = []
    let paramIndex = 1

    if (options.search) {
      whereConditions.push(`(c.claim_number ILIKE $${paramIndex} OR c.homeowner_name ILIKE $${paramIndex})`)
      params.push(`%${options.search}%`)
      paramIndex++
    }

    if (options.status) {
      whereConditions.push(`c.status = $${paramIndex}`)
      params.push(options.status)
      paramIndex++
    }

    if (options.source) {
      whereConditions.push(`c.source = $${paramIndex}`)
      params.push(options.source)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const baseQuery = `
      SELECT 
        c.id, c.claim_number, c.status, c.homeowner_name,
        c.homeowner_phone, c.homeowner_email, c.homeowner_address, c.insurance_company,
        c.property_classification, c.claim_type, c.cause_of_loss, c.affected_areas,
        c.submitted_date, c.source, c.notes, c.created_at, c.updated_at
      FROM claims c
    `

    return DatabaseOperations.paginate(baseQuery, whereClause, params, options)
  }

  static async create(data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const processedData = {
        ...data,
        claim_date: data.claim_date || null,
        date_of_loss: data.date_of_loss || null,
        submitted_date: data.submitted_date || null,
      }

      const result = await sql`
        INSERT INTO claims (
          claim_number, status, claim_date, homeowner_name, homeowner_phone,
          homeowner_email, homeowner_address, insurance_company, property_classification,
          claim_type, cause_of_loss, affected_areas, date_of_loss, property_type,
          damage_type, adjuster_name, adjuster_email, adjuster_phone, claim_amount,
          company, source, notes, submitted_date, created_at, updated_at
        )
        VALUES (
          ${processedData.claim_number}, ${processedData.status}, ${processedData.claim_date}, ${processedData.homeowner_name}, 
          ${processedData.homeowner_phone}, ${processedData.homeowner_email}, ${processedData.homeowner_address}, 
          ${processedData.insurance_company}, ${processedData.property_classification}, ${processedData.claim_type}, 
          ${processedData.cause_of_loss}, ${processedData.affected_areas}, ${processedData.date_of_loss}, 
          ${processedData.property_type}, ${processedData.damage_type}, ${processedData.adjuster_name}, 
          ${processedData.adjuster_email}, ${processedData.adjuster_phone}, ${processedData.claim_amount},
          ${processedData.company}, ${processedData.source}, ${processedData.notes}, ${processedData.submitted_date}, NOW(), NOW()
        )
        RETURNING *
      `

      await DatabaseOperations.logActivity(userId, "CREATE", "claim", result[0].id, data)
      return result[0]
    })
  }
}

// Follow-up operations
export class FollowupOperations {
  static async getAll(
    options: PaginationOptions & {
      status?: string
      vendorId?: number
      companyTag?: string
      userId?: string
      userRole?: string
      isAdmin?: boolean
      representative?: string
    } = {},
  ) {
    const whereConditions = ["1=1"]
    const params: any[] = []
    let paramIndex = 1

    if (options.status) {
      whereConditions.push(`vf.status = $${paramIndex}`)
      params.push(options.status)
      paramIndex++
    }

    if (options.vendorId) {
      whereConditions.push(`vf.vendor_id = $${paramIndex}`)
      params.push(options.vendorId)
      paramIndex++
    }

    if (options.companyTag) {
      whereConditions.push(`v.company_tag = $${paramIndex}`)
      params.push(options.companyTag)
      paramIndex++
    }

    if (!options.isAdmin && options.representative) {
      whereConditions.push(`(v.representative = $${paramIndex} OR v."Representative_2" = $${paramIndex})`)
      params.push(options.representative)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const baseQuery = `
      SELECT 
        vf.id, vf.vendor_id, vf.follow_up_date, vf.follow_up_time,
        vf.meeting_type, vf.organizer, vf.address, vf.notes,
        vf.status, vf.created_by, vf.created_at, vf.updated_at,
        vf.answered, vf.voicemail, vf.text_sent, vf.email_sent, 
        vf.zoom_meeting, vf.in_person_meeting, vf.last_call_rating, 
        vf.completed_date, vf.licensed, vf.representative, vf.trade_type,
        v.name as vendor_name, v.location as vendor_location,
        v.trade_type as vendor_trade_type, v.phone as vendor_phone,
        v.email as vendor_email, v.business_name as vendor_business_name,
        COALESCE(followup_notes_count.count, 0) as notes_count
      FROM vendor_followups vf
      LEFT JOIN vendors v ON vf.vendor_id = v.id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM vendor_followup_notes 
        GROUP BY vendor_id
      ) followup_notes_count ON vf.vendor_id = followup_notes_count.vendor_id
    `

    return DatabaseOperations.paginate(baseQuery, whereClause, params, options)
  }

  static async create(data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        INSERT INTO vendor_followups (
          vendor_id, follow_up_date, follow_up_time, meeting_type,
          organizer, address, notes, status, created_by,
          created_at, updated_at
        )
        VALUES (
          ${data.vendor_id}, ${data.follow_up_date}, ${data.follow_up_time}, 
          ${data.meeting_type}, ${data.organizer}, ${data.address}, 
          ${data.notes}, ${data.status}, ${data.created_by},
          NOW(), NOW()
        )
        RETURNING *
      `

      await DatabaseOperations.logActivity(userId, "CREATE", "followup", result[0].id, data)
      return result[0]
    })
  }

  static async updateStatus(id: number, status: string, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const followupResult = await sql`
        SELECT vendor_id, status as old_status FROM vendor_followups WHERE id = ${id}
      `

      if (followupResult.length === 0) {
        throw new DatabaseError("Follow-up not found", "NOT_FOUND")
      }

      const vendorId = followupResult[0].vendor_id
      const oldStatus = followupResult[0].old_status

      const dbStatus = status.toLowerCase()

      const result = await sql`
        UPDATE vendor_followups 
        SET status = ${dbStatus}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      if (dbStatus === "completed" && oldStatus !== "completed") {
        await sql`
          UPDATE vendors 
          SET 
            followups_completed = COALESCE(followups_completed, 0) + 1,
            followups_count = COALESCE(followups_count, 0) + 1,
            updated_at = NOW()
          WHERE id = ${vendorId}
        `
      }

      await DatabaseOperations.logActivity(userId, "UPDATE_STATUS", "followup", id, { status: dbStatus, oldStatus })
      return result[0]
    })
  }

  static async getFollowupNotes(followupId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        SELECT 
          vfn.id, vfn.vendor_id, vfn.followup_date, vfn.followup_number,
          vfn.notes, vfn.created_at, vfn.updated_at,
          v.name as vendor_name
        FROM vendor_followup_notes vfn
        LEFT JOIN vendors v ON vfn.vendor_id = v.id
        WHERE vfn.vendor_id = (
          SELECT vendor_id FROM vendor_followups WHERE id = ${followupId}
        )
        ORDER BY vfn.created_at DESC
      `
      return result
    })
  }

  static async addFollowupNote(
    data: {
      vendorId: number
      followupDate: string
      followupNumber: number
      notes: string
    },
    userId: number,
  ) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        INSERT INTO vendor_followup_notes (
          vendor_id, followup_date, followup_number, notes, created_at, updated_at
        )
        VALUES (
          ${data.vendorId}, ${data.followupDate}, ${data.followupNumber}, 
          ${data.notes}, NOW(), NOW()
        )
        RETURNING *
      `

      await DatabaseOperations.logActivity(userId, "CREATE", "followup_note", result[0].id, data)
      return result[0]
    })
  }

  static async update(id: number, data: any, userId?: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const updateFields: string[] = []
      const updateValues: any[] = []
      let paramIndex = 1

      const allowedFields = [
        "vendor_id",
        "follow_up_date",
        "follow_up_time",
        "meeting_type",
        "organizer",
        "address",
        "notes",
        "status",
        "answered", // Changed from contact_answered
        "voicemail", // Changed from contact_voicemail
        "text_sent", // Changed from contact_text
        "email_sent", // Changed from contact_email
        "last_call_rating", // Changed from rating
        "licensed",
        "representative",
        "trade_type",
        "completed_date",
      ]

      for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = $${paramIndex}`)
          updateValues.push(data[field])
          paramIndex++
        }
      }

      updateFields.push(`updated_at = NOW()`)

      if (updateFields.length === 1) {
        throw new DatabaseError("No valid fields provided for update", "INVALID_INPUT")
      }

      updateValues.push(id)
      const whereParamIndex = paramIndex

      const query = `
        UPDATE vendor_followups 
        SET ${updateFields.join(", ")}
        WHERE id = $${whereParamIndex}
        RETURNING *
      `

      const result = await sql.query(query, updateValues)

      if (result.length === 0) {
        throw new DatabaseError("Follow-up not found", "NOT_FOUND")
      }

      if (userId) {
        await DatabaseOperations.logActivity(userId, "UPDATE", "followup", id, data)
      }
      return result[0]
    })
  }
}

// Telemarketing operations
export class TelemarketingOperations {
  static async getLeadLists() {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        SELECT 
          ll.id, ll.name, ll.description, ll.created_by, ll.created_at, ll.updated_at, ll.is_active,
          u.name as created_by_name,
          COUNT(tl.id) as leads_count
        FROM telemarketing_lead_lists ll
        LEFT JOIN users u ON ll.created_by = u.id
        LEFT JOIN telemarketing_leads tl ON ll.id = tl.list_id
        WHERE ll.is_active = true
        GROUP BY ll.id, ll.name, ll.description, ll.created_by, ll.created_at, ll.updated_at, ll.is_active, u.name
        ORDER BY ll.created_at DESC
      `
      return result
    })
  }

  static async createLeadList(data: { name: string; description?: string; created_by: number }) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        INSERT INTO telemarketing_lead_lists (name, description, created_by, created_at, updated_at)
        VALUES (${data.name}, ${data.description || null}, ${data.created_by}, NOW(), NOW())
        RETURNING *
      `

      await DatabaseOperations.logActivity(data.created_by, "CREATE", "lead_list", result[0].id, data)
      return result[0]
    })
  }

  static async getAll(
    options: PaginationOptions & {
      search?: string
      status?: string
      priority?: string
      listId?: number
      assignedTo?: number
      isAdmin?: boolean
    } = {},
  ) {
    const whereConditions = ["1=1"]
    const params: any[] = []
    let paramIndex = 1

    if (options.search) {
      whereConditions.push(
        `(tl.company_name ILIKE $${paramIndex} OR tl.contact_person ILIKE $${paramIndex} OR tl.email ILIKE $${paramIndex})`,
      )
      params.push(`%${options.search}%`)
      paramIndex++
    }

    if (options.status) {
      whereConditions.push(`tl.status = $${paramIndex}`)
      params.push(options.status)
      paramIndex++
    }

    if (options.priority) {
      whereConditions.push(`tl.priority = $${paramIndex}`)
      params.push(options.priority)
      paramIndex++
    }

    if (options.listId) {
      whereConditions.push(`tl.list_id = $${paramIndex}`)
      params.push(options.listId)
      paramIndex++
    }

    if (options.assignedTo) {
      whereConditions.push(`tl.assigned_to = $${paramIndex}`)
      params.push(options.assignedTo)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const baseQuery = `
      SELECT 
        tl.id, tl.company_name, tl.contact_person, tl.phone, tl.email, tl.address,
        tl.industry, tl.lead_source, tl.status, tl.priority, tl.notes,
        tl.last_contact_date, tl.next_contact_date, tl.assigned_to, tl.created_by,
        tl.created_at, tl.updated_at, tl.list_id,
        u.name as assigned_to_name,
        ll.name as list_name
      FROM telemarketing_leads tl
      LEFT JOIN users u ON tl.assigned_to = u.id
      LEFT JOIN lead_lists ll ON tl.list_id = ll.id
    `

    return DatabaseOperations.paginate(baseQuery, whereClause, params, options)
  }

  static async create(data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        INSERT INTO telemarketing_leads (
          company_name, contact_person, phone, email, address, industry,
          lead_source, status, priority, notes, assigned_to, created_by,
          list_id, created_at, updated_at
        )
        VALUES (
          ${data.company_name}, ${data.contact_person}, ${data.phone}, ${data.email},
          ${data.address}, ${data.industry}, ${data.lead_source}, ${data.status || "new"},
          ${data.priority || "medium"}, ${data.notes}, ${data.assigned_to},
          ${data.created_by}, ${data.list_id}, NOW(), NOW()
        )
        RETURNING *
      `

      await DatabaseOperations.logActivity(userId, "CREATE", "telemarketing_lead", result[0].id, data)
      return result[0]
    })
  }

  static async createBulk(leads: any[], userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const results = []

      for (const leadData of leads) {
        const result = await sql`
          INSERT INTO telemarketing_leads (
            company_name, contact_person, phone, email, address, industry,
            lead_source, status, priority, notes, created_by, list_id,
            created_at, updated_at
          )
          VALUES (
            ${leadData.company_name}, ${leadData.contact_person}, ${leadData.phone}, 
            ${leadData.email}, ${leadData.address}, ${leadData.industry},
            ${leadData.lead_source || "csv_import"}, ${leadData.status || "new"},
            ${leadData.priority || "medium"}, ${leadData.notes}, ${userId},
            ${leadData.list_id}, NOW(), NOW()
          )
          RETURNING *
        `
        results.push(result[0])
      }

      await DatabaseOperations.logActivity(userId, "BULK_CREATE", "telemarketing_lead", 0, { count: results.length })
      return results
    })
  }

  static async update(id: number, data: any, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const updateFields: string[] = []
      const updateValues: any[] = []
      let paramIndex = 1

      const allowedFields = [
        "company_name",
        "contact_person",
        "phone",
        "email",
        "address",
        "industry",
        "lead_source",
        "status",
        "priority",
        "notes",
        "last_contact_date",
        "next_contact_date",
        "assigned_to",
        "list_id",
      ]

      for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = $${paramIndex}`)
          updateValues.push(data[field])
          paramIndex++
        }
      }

      updateFields.push(`updated_at = NOW()`)

      if (updateFields.length === 1) {
        throw new DatabaseError("No valid fields provided for update", "INVALID_INPUT")
      }

      updateValues.push(id)
      const whereParamIndex = paramIndex

      const query = `
        UPDATE telemarketing_leads 
        SET ${updateFields.join(", ")}
        WHERE id = $${whereParamIndex}
        RETURNING *
      `

      const result = await sql.query(query, updateValues)

      if (result.length === 0) {
        throw new DatabaseError("Lead not found", "NOT_FOUND")
      }

      await DatabaseOperations.logActivity(userId, "UPDATE", "telemarketing_lead", id, data)
      return result[0]
    })
  }

  static async delete(id: number, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        DELETE FROM telemarketing_leads 
        WHERE id = ${id}
        RETURNING *
      `

      if (result.length === 0) {
        throw new DatabaseError("Lead not found", "NOT_FOUND")
      }

      await DatabaseOperations.logActivity(userId, "DELETE", "telemarketing_lead", id)
      return result[0]
    })
  }

  static async assignLead(leadId: number, assignedTo: number, userId: number) {
    return DatabaseOperations.executeWithErrorHandling(async () => {
      const result = await sql`
        UPDATE telemarketing_leads 
        SET assigned_to = ${assignedTo}, updated_at = NOW()
        WHERE id = ${leadId}
        RETURNING *
      `

      if (result.length === 0) {
        throw new DatabaseError("Lead not found", "NOT_FOUND")
      }

      await DatabaseOperations.logActivity(userId, "ASSIGN", "telemarketing_lead", leadId, { assignedTo })
      return result[0]
    })
  }
}

export { sql }
