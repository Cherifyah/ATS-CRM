import React from 'react'
import { LayoutDashboard, Users, ClipboardList, Building, Phone, Mail, Archive, BarChart2 } from 'lucide-react'

const items = [
  { section: 'Activité', links: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'candidats', label: 'Candidats', icon: Users },
    { id: 'prequal', label: 'Trame préqual', icon: ClipboardList },
    { id: 'clients', label: 'CRM Clients', icon: Building },
  ]},
  { section: 'Prospection', links: [
    { id: 'prospection', label: 'Prospection', icon: Phone },
  ]},
  { section: 'Archives', links: [
    { id: 'archives', label: 'Archivés / Flaggués', icon: Archive },
  ]},
]

export default function Sidebar({ current, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sub">Audit Recrutement</div>
        <div className="name">CK Consulting</div>
      </div>
      {items.map(section => (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-label">{section.section}</div>
          {section.links.map(link => {
            const Icon = link.icon
            return (
              <div
                key={link.id}
                className={`nav-item ${current === link.id ? 'active' : ''}`}
                onClick={() => onNavigate(link.id)}
              >
                <Icon size={15} />
                {link.label}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
