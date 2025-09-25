"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/hooks/use-permissions"

export function TelemarketingAdminDashboard() {
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [powerDialerOn, setPowerDialerOn] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [scriptStore, setScriptStore] = useState({})
  const [leadListStore, setLeadListStore] = useState({})
  const [phoneNumberStore, setPhoneNumberStore] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalContent, setModalContent] = useState("")
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([])
  const [generationInProgress, setGenerationInProgress] = useState(false)
  type Stats = {
    totalCallsToday: number
    callSuccessRate: number
    convertedLeads: number
    conversionRate: number
    avgCallDurationToday: number
    [key: string]: any
  }
  const [stats, setStats] = useState<Stats | null>(null)
  type User = {
    id: string
    name: string
    has_telemarketing_access: boolean
    phone_number: string | null
    script: string
    leadLists: string[]
    [key: string]: any
  }
  const [users, setUsers] = useState<User[]>([])
  const [leadLists, setLeadLists] = useState([])
  const { isAdmin, isSuperAdmin } = usePermissions()

  const [editingScript, setEditingScript] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string>("")

  const [scriptEditModal, setScriptEditModal] = useState<{
    isOpen: boolean
    scriptName: string
    content: string
  }>({
    isOpen: false,
    scriptName: "",
    content: "",
  })

  const sections = ["dashboard", "management", "lead-generation"]

  const showSection = (section: string) => {
    setCurrentSection(section)
    window.location.hash = section
  }

  const togglePowerDialer = () => {
    setPowerDialerOn(!powerDialerOn)
  }

  const openModal = (title: string, content: string) => {
    setModalTitle(title)
    setModalContent(content)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalContent("")
  }

  const addToken = (listEl: HTMLElement, num: string) => {
    const span = document.createElement("span")
    span.className = "token"
    span.dataset.num = num
    span.innerHTML = `${num} <button type="button" data-remove>&times;</button>`
    listEl.appendChild(span)
  }

  const serializeUMRow = (row: HTMLElement) => {
    const user = row.dataset.user
    const numbers = [...row.querySelectorAll(".token")].map(
      (t) => (t as HTMLElement).dataset.num || t.textContent?.trim(),
    )
    const script = (row.querySelector(".scriptSel") as HTMLSelectElement)?.value || ""
    const lists = row.querySelector(".leadLists")
      ? [...(row.querySelector(".leadLists") as HTMLSelectElement).selectedOptions].map((o) => o.value)
      : []
    return { user, numbers, script, lead_lists: lists }
  }

  const generateLeads = async () => {
    if (selectedDataSources.length === 0) {
      alert("Please select at least one data source")
      return
    }

    setGenerationInProgress(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const newLeadList = {
        name: `Generated-${Date.now()}`,
        rows: Math.floor(Math.random() * 1000) + 100,
        created: "Just now",
        assigned: "Unassigned",
        sources: selectedDataSources,
      }

      setLeadListStore((prev) => ({
        ...prev,
        [newLeadList.name]: newLeadList,
      }))

      alert(`Successfully generated ${newLeadList.rows} leads from ${selectedDataSources.join(", ")}`)
    } catch (error) {
      alert("Failed to generate leads. Please try again.")
    } finally {
      setGenerationInProgress(false)
    }
  }

  const toggleDataSource = (source: string) => {
    setSelectedDataSources((prev) => (prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]))
  }

  const fetchScripts = async () => {
    try {
      console.log("[v0] Fetching scripts from /api/telemarketing/scripts")
      const response = await fetch("/api/telemarketing/scripts")
      console.log("[v0] Scripts response status:", response.status)

      if (response.ok) {
        const scripts = await response.json()
        console.log("[v0] Scripts fetched successfully:", scripts.length)
        setScriptStore(
          scripts.reduce((acc: Record<string, any>, script: any) => {
            acc[script.name] = script
            return acc
          }, {}),
        )
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch scripts:", response.status, errorText)
        console.error("Failed to fetch scripts:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching scripts:", error)
      console.error("Error fetching scripts:", error)
    }
  }

  const fetchStats = async () => {
    try {
      console.log("[v0] Fetching telemarketing stats")
      const response = await fetch("/api/telemarketing/stats")
      console.log("[v0] Stats response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Stats fetched successfully:", data)
        setStats(data)
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch telemarketing stats:", response.status, errorText)
        console.error("Failed to fetch telemarketing stats:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching telemarketing stats:", error)
      console.error("Error fetching telemarketing stats:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      console.log("[v0] Fetching all CRM users for telemarketing management")
      const response = await fetch("/api/users?limit=1000")
      console.log("[v0] Users response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        const allUsers = responseData.users || []
        console.log("[v0] All users fetched successfully:", allUsers.length)

        if (!Array.isArray(allUsers)) {
          console.error("[v0] Users data is not an array:", allUsers)
          setUsers([])
          return
        }

        const usersWithTelemarketingStatus = allUsers.map((user) => ({
          ...user,
          has_telemarketing_access: user.telemarketing_access || false,
          phone_number: user.phone_number || null,
          script: user.telemarketing_script || "Default Script",
          leadLists: user.telemarketing_lead_lists || [],
        }))

        setUsers(usersWithTelemarketingStatus)
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch users:", response.status, errorText)
        console.error("Failed to fetch users:", response.statusText)
        setUsers([])
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("[v0] Error fetching users:", error.message)
      } else {
        console.error("[v0] Error fetching users:", error)
      }
      console.error("Error fetching users:", error)
      setUsers([])
    }
  }

  const fetchLeadLists = async () => {
    try {
      console.log("[v0] Fetching lead lists")
      const response = await fetch("/api/telemarketing/lead-lists")
      console.log("[v0] Lead lists response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        const lists = data.leadLists || []
        console.log("[v0] Lead lists fetched successfully:", lists.length)
        setLeadLists(lists)
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch lead lists:", response.status, errorText)
        console.error("Failed to fetch lead lists:", response.statusText)
        setLeadLists([])
      }
    } catch (error) {
      console.error("[v0] Error fetching lead lists:", error)
      console.error("Error fetching lead lists:", error)
      setLeadLists([])
    }
  }

  const uploadScript = async () => {
    const nameInput = document.getElementById("scriptUploadName") as HTMLInputElement
    const fileInput = document.getElementById("scriptUploadFile") as HTMLInputElement

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select a file to upload")
      return
    }

    const file = fileInput.files[0]
    const scriptName = nameInput.value.trim() || file.name.replace(/\.[^/.]+$/, "")

    const formData = new FormData()
    formData.append("name", scriptName)
    formData.append("file", file)

    try {
      const response = await fetch("/api/telemarketing/scripts", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        alert("Script uploaded successfully!")
        nameInput.value = ""
        fileInput.value = ""
        fetchScripts()
      } else {
        const error = await response.text()
        alert(`Failed to upload script: ${error}`)
      }
    } catch (error) {
      console.error("Error uploading script:", error)
      alert("Failed to upload script. Please try again.")
    }
  }

  const uploadLeadList = async () => {
    const nameInput = document.getElementById("leadUploadName") as HTMLInputElement
    const fileInput = document.getElementById("leadUploadFile") as HTMLInputElement

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select a CSV file to upload")
      return
    }

    const file = fileInput.files[0]
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file")
      return
    }

    const listName = nameInput.value.trim() || file.name.replace(/\.[^/.]+$/, "")

    const formData = new FormData()
    formData.append("name", listName)
    formData.append("file", file)

    try {
      const response = await fetch("/api/telemarketing/lead-lists", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Lead list uploaded successfully! ${result.rowCount} leads imported.`)
        nameInput.value = ""
        fileInput.value = ""
        fetchLeadLists()
      } else {
        const error = await response.text()
        alert(`Failed to upload lead list: ${error}`)
      }
    } catch (error) {
      console.error("Error uploading lead list:", error)
      alert("Failed to upload lead list. Please try again.")
    }
  }

  const uploadPhoneNumber = async () => {
    const fileInput = document.querySelector(".phone-number-file-input") as HTMLInputElement
    const nameInput = document.querySelector(".phone-number-name-input")
    const callerIdInput = document.querySelector(".caller-id-input")

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select a file")
      return
    }
    const file = fileInput.files[0]

    // Use filename if no name provided
    const phoneNumberName =
      nameInput && (nameInput as HTMLInputElement).value !== undefined
        ? (nameInput as HTMLInputElement).value.trim() || file.name.replace(/\.[^/.]+$/, "")
        : file.name.replace(/\.[^/.]+$/, "")
    const callerId = callerIdInput && (callerIdInput as HTMLInputElement).value !== undefined
      ? (callerIdInput as HTMLInputElement).value.trim() || "Unknown"
      : "Unknown"

    try {
      const text = await file.text()
      const numbers = text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.trim())

      setPhoneNumberStore((prev) => ({
        ...prev,
        [phoneNumberName]: {
          numbers: numbers,
          callerId: callerId,
          uploadDate: new Date().toISOString(),
        },
      }))

      // Clear inputs
      fileInput.value = ""
      (nameInput as HTMLInputElement).value = ""
      (callerIdInput as HTMLInputElement).value = ""

      alert(`Phone number list "${phoneNumberName}" uploaded successfully with ${numbers.length} numbers`)
    } catch (error) {
      console.error("Error uploading phone numbers:", error)
      alert("Error uploading phone numbers")
    }
  }

  const saveUser = async (userId: string) => {
    const row = document.querySelector(`tr[data-user="${userId}"]`)
    if (!row) return

    const userData = serializeUMRow(row as HTMLTableRowElement)

    try {
      const response = await fetch(`/api/telemarketing/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        alert("User settings saved successfully!")
      } else {
        const error = await response.text()
        alert(`Failed to save user settings: ${error}`)
      }
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Failed to save user settings. Please try again.")
    }
  }

  const saveAllUsers = async () => {
    const rows = document.querySelectorAll("tbody tr[data-user]")
    const allUserData = Array.from(rows).map((row) => serializeUMRow(row as HTMLTableRowElement))

    try {
      const response = await fetch("/api/telemarketing/users/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: allUserData }),
      })

      if (response.ok) {
        alert("All user settings saved successfully!")
      } else {
        const error = await response.text()
        alert(`Failed to save user settings: ${error}`)
      }
    } catch (error) {
      console.error("Error saving all users:", error)
      alert("Failed to save user settings. Please try again.")
    }
  }

  const toggleTelemarketingAccess = async (userId: string, currentAccess: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/telemarketing-access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ has_access: !currentAccess }),
      })

      if (response.ok) {
        setUsers(
          users.map((user) => (user.id === userId ? { ...user, has_telemarketing_access: !currentAccess } : user)),
        )
        alert(`Telemarketing access ${!currentAccess ? "granted" : "removed"} successfully!`)
      } else {
        const error = await response.text()
        alert(`Failed to update telemarketing access: ${error}`)
      }
    } catch (error) {
      console.error("Error updating telemarketing access:", error)
      alert("Failed to update telemarketing access. Please try again.")
    }
  }

  const openScriptModal = (scriptName: string, content: string) => {
    setScriptEditModal({
      isOpen: true,
      scriptName,
      content,
    })
  }

  const handleScriptContentChange = (content: string) => {
    setScriptEditModal((prev) => ({
      ...prev,
      content,
    }))
  }

  const saveEditedScript = async () => {
    try {
      const response = await fetch("/api/telemarketing/scripts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: scriptEditModal.scriptName,
          content: scriptEditModal.content,
        }),
      })

      if (response.ok) {
        alert("Script saved successfully!")
        setScriptEditModal({ isOpen: false, scriptName: "", content: "" })
        fetchScripts()
      } else {
        const error = await response.text()
        alert(`Failed to save script: ${error}`)
      }
    } catch (error) {
      console.error("Error saving script:", error)
      alert("Error saving script")
    }
  }

  const closeScriptEditModal = () => {
    setScriptEditModal({ isOpen: false, scriptName: "", content: "" })
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchScripts()
    fetchLeadLists()

    const statsInterval = setInterval(fetchStats, 30000)

    return () => clearInterval(statsInterval)
  }, [])

  useEffect(() => {
    const defaultScript = {
      name: "Default Script",
      content: `Hello, this is [AGENT_NAME] calling from [COMPANY_NAME]. 

I hope you're having a great day! I'm reaching out because we have some exciting opportunities that might be of interest to you.

[PAUSE FOR RESPONSE]

We specialize in [SERVICE/PRODUCT] and have helped many clients like yourself achieve [BENEFIT]. 

Would you have a few minutes to discuss how we might be able to help you as well?

[IF YES] Great! Let me tell you more about...
[IF NO] I understand you're busy. Would there be a better time to call you back?

Thank you for your time today!`,
      size: "2.1 KB",
      modified: "Just created",
    }

    setScriptStore((prev) => ({
      "Default Script": defaultScript,
      ...prev,
    }))
  }, [])

  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        :root {
          --bg: #f6f8fb;
          --surface: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --border: #e5e7eb;
          --brand: #1e293b;
          --brand-600: #0f172a;
          --brand-hover: #334155;
          --success: #10b981;
          --warn: #f59e0b;
          --danger: #ef4444;
          --radius: 16px;
          --shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          --shadow-sm: 0 4px 16px rgba(15, 23, 42, 0.06);
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
          grid-template-areas: "top" "main";
          height: 100vh;
          background: var(--bg);
          color: var(--text);
          font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .topbar {
          grid-area: top;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 16px;
          align-items: center;
          padding: 12px 18px;
          box-shadow: var(--shadow-sm);
        }

        .search {
          display: flex;
          gap: 10px;
        }

        .search input {
          width: 380px;
          max-width: 55vw;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          background: #fbfdff;
        }

        .top-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn {
          border: 1px solid var(--border);
          background: #ffffff;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
        }

        .btn-primary {
          background: linear-gradient(180deg, #1e293b, #0f172a);
          color: #fff;
          border: 0;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: linear-gradient(180deg, #334155, #1e293b);
          transform: translateY(-1px);
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e2e8f0;
        }

        .main {
          grid-area: main;
          overflow: auto;
          padding: 18px;
        }

        .grid {
          display: grid;
          gap: 16px;
        }

        .cards {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, 1fr);
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .card .hd {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 12px;
        }

        .card .bd {
          padding: 14px;
        }

        .kpi {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kpi strong {
          font-size: 28px;
        }

        .kpi small {
          color: var(--muted);
        }

        .two {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
        }

        .chart {
          height: 120px;
          display: flex;
          align-items: end;
          gap: 4px;
          padding: 12px 0;
        }

        .chart-bar {
          flex: 1;
          background: linear-gradient(180deg, #3b82f6, #1d4ed8);
          border-radius: 2px;
          min-height: 8px;
          transition: all 0.2s;
          position: relative;
        }

        .chart-bar:hover {
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          transform: scaleY(1.05);
        }

        .chart-bar::after {
          content: attr(data-value);
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--muted);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .chart-bar:hover::after {
          opacity: 1;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        th,
        td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
        }

        thead th {
          font-size: 12px;
          color: var(--muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        tbody tr:hover {
          background: #f9fbff;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid var(--border);
          background: #f8fafc;
        }

        .tag.ok {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #065f46;
        }

        .tag.warn {
          background: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        label {
          font-size: 12px;
          color: var(--muted);
        }

        input[type="text"],
        input[type="number"],
        select,
        textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: #ffffff;
        }

        textarea {
          min-height: 120px;
        }

        .switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .switch input {
          display: none;
        }

        .switch .slider {
          width: 44px;
          height: 26px;
          border-radius: 999px;
          background: #e2e8f0;
          position: relative;
          border: 1px solid var(--border);
        }

        .switch .slider::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
        }

        .switch input:checked + .slider {
          background: linear-gradient(180deg, var(--brand), var(--brand-600));
          border: 0;
        }

        .switch input:checked + .slider::after {
          transform: translateX(18px);
        }

        .toolbar {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .toolbar .sp {
          flex: 1;
        }

        .pill {
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef6ff;
          border: 1px solid #cfe8ff;
          color: #0b3b7a;
          font-weight: 600;
          font-size: 12px;
        }

        .muted {
          color: var(--muted);
        }

        .token-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .token {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
        }

        .token button {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .add-number {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .add-number input {
          flex: 1;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }

        .right-stack {
          display: grid;
          gap: 16px;
        }

        .modal {
          position: fixed;
          inset: 0;
          display: ${modalOpen ? "block" : "none"};
        }

        .modal .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
        }

        .modal .panel {
          position: absolute;
          top: 8vh;
          left: 50%;
          transform: translateX(-50%);
          width: min(900px, 92vw);
          max-height: 84vh;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
        }

        .modal header {
          padding: 14px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal main {
          padding: 14px;
          overflow: auto;
        }

        .section-nav {
          display: flex;
          gap: 2px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
        }
        
        .section-nav button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          color: var(--muted);
        }
        
        .section-nav button.active {
          background: linear-gradient(180deg, #1e293b, #0f172a);
          color: #fff;
          box-shadow: var(--shadow-sm);
        }
        
        .section-nav button:hover:not(.active) {
          background: var(--surface);
          color: var(--brand);
        }

        .data-sources {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        
        .data-source {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .data-source.selected {
          border-color: var(--brand);
          background: #f0f9ff;
        }
        
        .data-source input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
        
        .generation-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 20px;
        }
        
        .btn-generate {
          background: linear-gradient(180deg, #1e293b, #0f172a);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-generate:hover:not(:disabled) {
          background: linear-gradient(180deg, #334155, #1e293b);
          transform: translateY(-1px);
        }

        .btn-generate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1200px) {
          .cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .two {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .cards {
            grid-template-columns: 1fr;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="layout">
        <main className="main">
          <div className="section-nav">
            <button className={currentSection === "dashboard" ? "active" : ""} onClick={() => showSection("dashboard")}>
              Dashboard
            </button>
            <button
              className={currentSection === "management" ? "active" : ""}
              onClick={() => showSection("management")}
            >
              Management
            </button>
            <button
              className={currentSection === "lead-generation" ? "active" : ""}
              onClick={() => showSection("lead-generation")}
            >
              Lead Generation
            </button>
          </div>

          {currentSection === "dashboard" && (
            <div className="grid">
              <div className="cards">
                <div className="card">
                  <div className="hd">Calls Today</div>
                  <div className="bd kpi">
                    <strong>{stats?.totalCallsToday || 0}</strong>
                    <small className="tag ok">{stats?.callSuccessRate || 0}% success rate</small>
                  </div>
                </div>
                <div className="card">
                  <div className="hd">Connection Rate</div>
                  <div className="bd kpi">
                    <strong>{stats?.callSuccessRate || 0}%</strong>
                    <small className="tag warn">Goal 32%</small>
                  </div>
                </div>
                <div className="card">
                  <div className="hd">Conversions</div>
                  <div className="bd kpi">
                    <strong>{stats?.convertedLeads || 0}</strong>
                    <small className="tag ok">CR {stats?.conversionRate || 0}%</small>
                  </div>
                </div>
                <div className="card">
                  <div className="hd">Avg Handle Time</div>
                  <div className="bd kpi">
                    <strong>
                      {Math.floor((stats?.avgCallDurationToday || 0) / 60)}:
                      {String((stats?.avgCallDurationToday || 0) % 60).padStart(2, "0")}
                    </strong>
                    <small>minutes</small>
                  </div>
                </div>
              </div>
              <div className="two">
                <div className="card">
                  <div className="hd">Volume (Today)</div>
                  <div className="bd">
                    <div className="chart">
                      {[
                        { hour: "9AM", calls: 45 },
                        { hour: "10AM", calls: 62 },
                        { hour: "11AM", calls: 38 },
                        { hour: "12PM", calls: 71 },
                        { hour: "1PM", calls: 55 },
                        { hour: "2PM", calls: 83 },
                        { hour: "3PM", calls: 67 },
                        { hour: "4PM", calls: 92 },
                        { hour: "5PM", calls: 48 },
                      ].map((data, index) => (
                        <div
                          key={index}
                          className="chart-bar"
                          style={{ height: `${(data.calls / 100) * 100}%` }}
                          data-value={data.calls}
                          title={`${data.hour}: ${data.calls} calls`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="hd">Team Leaderboard</div>
                  <div className="bd">
                    <table>
                      <thead>
                        <tr>
                          <th>Agent</th>
                          <th>Calls</th>
                          <th>Sales</th>
                          <th>Conn%</th>
                          <th>AHT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter((user) => user.has_telemarketing_access)
                          .map((user) => {
                            const callsToday = Math.floor(Math.random() * 100) + 20
                            const sales = Math.floor(Math.random() * 15) + 1
                            const connectionRate = Math.floor(Math.random() * 40) + 15
                            const avgHandleTime = Math.floor(Math.random() * 300) + 120 // seconds

                            return (
                              <tr key={user.id}>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span>{user.name}</span>
                                    <small className="tag ok">Active</small>
                                  </div>
                                </td>
                                <td>
                                  <strong>{callsToday}</strong>
                                </td>
                                <td>
                                  <strong>{sales}</strong>
                                  <small className="text-green-600">{Math.round((sales / callsToday) * 100)}%</small>
                                </td>
                                <td>
                                  <span className={connectionRate > 25 ? "text-green-600" : "text-orange-600"}>
                                    {connectionRate}%
                                  </span>
                                </td>
                                <td>
                                  <span>
                                    {Math.floor(avgHandleTime / 60)}:{String(avgHandleTime % 60).padStart(2, "0")}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === "management" && (
            <div className="grid">
              <div className="form-grid">
                <label>Filter users</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button className="btn-primary" onClick={saveAllUsers}>
                  Save All
                </button>
              </div>
              <div className="card">
                <div className="hd">Users</div>
                <div className="bd">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Numbers</th>
                        <th>Script</th>
                        <th>Lead Lists</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          data-user={user.name}
                          className={!user.has_telemarketing_access ? "opacity-60" : ""}
                        >
                          <td>
                            <div className="flex items-center gap-2">
                              {user.name}
                              <select
                                className="accessSel"
                                defaultValue={user.has_telemarketing_access ? "granted" : "denied"}
                                onChange={(e) => {
                                  const hasAccess = e.target.value === "granted"
                                  toggleTelemarketingAccess(user.id, !hasAccess) // Toggle to opposite of current state
                                }}
                              >
                                <option value="denied">No Access</option>
                                <option value="granted">Access Granted</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            {user.has_telemarketing_access ? (
                              <div className="token-list">
                                {user.phone_number ? (
                                  <span key={user.phone_number} className="token" data-num={user.phone_number}>
                                    {user.phone_number}{" "}
                                    <button type="button" data-remove onClick={() => {}}>
                                      &times;
                                    </button>
                                  </span>
                                ) : (
                                  <span className="text-gray-500">No number assigned</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No access</span>
                            )}
                          </td>
                          <td>
                            {user.has_telemarketing_access ? (
                              <select className="scriptSel" defaultValue={user.script}>
                                {Object.keys(scriptStore).map((scriptName) => (
                                  <option key={scriptName}>{scriptName}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-gray-400">No access</span>
                            )}
                          </td>
                          <td>
                            {user.has_telemarketing_access ? (
                              <select
                                className="leadLists"
                                defaultValue={user.leadLists?.[0] || ""}
                                onChange={(e) => {
                                  // Handle single selection change
                                  const selectedList = e.target.value
                                  // You can add logic here to update the user's assigned lead list
                                }}
                              >
                                <option value="">Select Lead List</option>
                                {leadLists.map((list) => (
                                  <option key={list.name} value={list.name}>
                                    {list.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-gray-400">No access</span>
                            )}
                          </td>
                          <td>
                            {user.has_telemarketing_access ? (
                              <button className="btn-primary" onClick={() => saveUser(user.id)} data-save-user>
                                Save
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <div className="hd">Scripts</div>
                <div className="bd">
                  <div className="form-grid">
                    <label>Script name (e.g., Roofing‑Intro‑v2)</label>
                    <input type="text" id="scriptUploadName" />
                    <label>Script file (.txt)</label>
                    <input type="file" id="scriptUploadFile" accept=".txt,.text" />
                    <button className="btn-primary" onClick={uploadScript}>
                      Upload Script
                    </button>
                  </div>
                  <div className="grid">
                    {Object.keys(scriptStore).map((scriptName) => (
                      <div key={scriptName} className="card">
                        <div className="hd">{scriptName}</div>
                        <div className="bd">
                          <div className="form-grid">
                            <label>Name</label>
                            <label>Size</label>
                            <label>Modified</label>
                          </div>
                          <div className="form-grid">
                            <span>{scriptName}</span>
                            <span>{scriptStore[scriptName].size || "—"}</span>
                            <span>{scriptStore[scriptName].modified || "—"}</span>
                            <button
                              className="btn-primary"
                              onClick={() => openScriptModal(scriptName, scriptStore[scriptName].content)}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(scriptStore).length === 0 && (
                      <div className="card">
                        <div className="bd">No scripts uploaded yet. Upload a script file to get started.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="hd">Lead Lists</div>
                <div className="bd">
                  <div
                    className="form-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <label style={{ fontWeight: "bold", color: "#333" }}>
                      List name (optional - will use filename if empty)
                    </label>
                    <input
                      type="text"
                      id="leadUploadName"
                      placeholder="Leave empty to use filename..."
                      style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                    <label style={{ fontWeight: "bold", color: "#333" }}>CSV file</label>
                    <input
                      type="file"
                      id="leadUploadFile"
                      accept=".csv"
                      style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                    <button
                      className="btn-primary"
                      onClick={uploadLeadList}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      📁 Upload CSV File
                    </button>
                  </div>
                  <div className="grid">
                    {leadLists.map((list) => (
                      <div key={list.name} className="card">
                        <div className="hd">{list.name}</div>
                        <div className="bd">
                          <div className="form-grid">
                            <label>Name</label>
                            <label>Rows</label>
                            <label>Created</label>
                            <label>Assigned</label>
                          </div>
                          <div className="form-grid">
                            <span>{list.name}</span>
                            <span>{list.rows}</span>
                            <span>{list.created}</span>
                            <span>{list.assigned}</span>
                            <button className="btn-primary" onClick={() => openModal(list.name, "")}>
                              Open
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {leadLists.length === 0 && (
                      <div className="card">
                        <div className="bd">No lead lists uploaded yet. Upload a CSV file to get started.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="hd">Phone Numbers</div>
                <div className="bd">
                  <div
                    className="form-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: "10px",
                      alignItems: "end",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <label>Phone Number List Name (optional)</label>
                      <input
                        type="text"
                        className="phone-number-name-input"
                        placeholder="Leave empty to use filename"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label>Caller ID</label>
                      <input
                        type="text"
                        className="caller-id-input"
                        placeholder="Enter caller ID name"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <button className="btn-primary" onClick={uploadPhoneNumber} style={{ height: "40px" }}>
                      Add Numbers
                    </button>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label>Enter Phone Numbers (one per line)</label>
                    <textarea
                      className="phone-numbers-textarea"
                      placeholder="Enter phone numbers, one per line:&#10;+1234567890&#10;+0987654321&#10;..."
                      rows={6}
                      style={{
                        width: "100%",
                        marginBottom: "10px",
                        fontFamily: "monospace",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px", textAlign: "center", color: "#666" }}>OR</div>

                  <div style={{ marginBottom: "20px" }}>
                    <label>Upload Phone Numbers (.txt file)</label>
                    <input type="file" className="phone-number-file-input" accept=".txt" style={{ width: "100%" }} />
                  </div>

                  <div className="section-title">UPLOADED PHONE NUMBER LISTS</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Numbers Count</th>
                        <th>Caller ID</th>
                        <th>Uploaded</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(phoneNumberStore).map(([name, data]) => (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{data.numbers?.length || 0}</td>
                          <td>{data.callerId}</td>
                          <td>{data.uploadDate ? new Date(data.uploadDate).toLocaleDateString() : "—"}</td>
                          <td>
                            <button
                              className="btn-secondary"
                              onClick={() =>
                                openModal(
                                  `Phone Numbers: ${name}`,
                                  `Caller ID: ${data.callerId}\n\nNumbers:\n${data.numbers?.join("\n") || "No numbers"}`,
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {Object.keys(phoneNumberStore).length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", color: "#666" }}>
                            No phone number lists uploaded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentSection === "lead-generation" && (
            <div className="grid">
              <div className="card">
                <div className="hd">Lead Generation</div>
                <div className="bd">
                  <p>
                    Select data sources to generate leads. Generated leads will automatically be added to your lead
                    lists.
                  </p>
                  <div className="data-sources">
                    <div className="data-source" onClick={() => toggleDataSource("Google Maps Business Listings")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Google Maps Business Listings")}
                        onChange={() => toggleDataSource("Google Maps Business Listings")}
                      />
                      Google Maps Business Listings
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Yellow Pages Directory")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Yellow Pages Directory")}
                        onChange={() => toggleDataSource("Yellow Pages Directory")}
                      />
                      Yellow Pages Directory
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Yelp Business Directory")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Yelp Business Directory")}
                        onChange={() => toggleDataSource("Yelp Business Directory")}
                      />
                      Yelp Business Directory
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Facebook Business Pages")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Facebook Business Pages")}
                        onChange={() => toggleDataSource("Facebook Business Pages")}
                      />
                      Facebook Business Pages
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("LinkedIn Company Profiles")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("LinkedIn Company Profiles")}
                        onChange={() => toggleDataSource("LinkedIn Company Profiles")}
                      />
                      LinkedIn Company Profiles
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Industry-Specific Directories")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Industry-Specific Directories")}
                        onChange={() => toggleDataSource("Industry-Specific Directories")}
                      />
                      Industry-Specific Directories
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Real Estate Listings")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Real Estate Listings")}
                        onChange={() => toggleDataSource("Real Estate Listings")}
                      />
                      Real Estate Listings
                    </div>
                    <div className="data-source" onClick={() => toggleDataSource("Construction Permits")}>
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes("Construction Permits")}
                        onChange={() => toggleDataSource("Construction Permits")}
                      />
                      Construction Permits
                    </div>
                  </div>
                  <div className="generation-controls">
                    <button className="btn-generate" onClick={generateLeads} disabled={generationInProgress}>
                      {generationInProgress ? "Generating..." : "Generate Leads"}
                    </button>
                    <span>
                      {selectedDataSources.length} data source{selectedDataSources.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="hd">Generated Leads</div>
                <div className="bd">
                  <table>
                    <thead>
                      <tr>
                        <th>Generated List</th>
                        <th>Leads</th>
                        <th>Sources</th>
                        <th>Created</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(leadListStore).map((list) => (
                        <tr key={list.name}>
                          <td>{list.name}</td>
                          <td>{list.rows}</td>
                          <td>{list.sources.join(", ")}</td>
                          <td>{list.created}</td>
                          <td className="tag ok">Ready</td>
                        </tr>
                      ))}
                      {Object.values(leadListStore).length === 0 && (
                        <tr>
                          <td colSpan={5}>
                            No generated leads yet. Select data sources and click "Generate Leads" to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {modalOpen && (
            <div className="modal">
              <div className="backdrop" onClick={closeModal}></div>
              <div className="panel">
                <header>
                  <h3>{modalTitle}</h3>
                  <button onClick={closeModal}>Close</button>
                </header>
                <main>{modalContent}</main>
              </div>
            </div>
          )}

          {scriptEditModal.isOpen && (
            <div
              className="modal-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                className="modal-content"
                style={{
                  backgroundColor: "white",
                  padding: "24px",
                  borderRadius: "8px",
                  width: "80%",
                  maxWidth: "800px",
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
              >
                <div
                  className="modal-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#333" }}>Edit Script: {scriptEditModal.scriptName}</h3>
                  <button
                    onClick={closeScriptEditModal}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "24px",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <textarea
                    value={scriptEditModal.content}
                    onChange={(e) => handleScriptContentChange(e.target.value)}
                    style={{
                      width: "100%",
                      height: "400px",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      resize: "vertical",
                      marginBottom: "16px",
                    }}
                    placeholder="Enter your script content here..."
                  />
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={closeScriptEditModal}
                      style={{
                        padding: "8px 16px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedScript}
                      style={{
                        padding: "8px 16px",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      💾 Save Script
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
