import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '../hooks/useTemplates'
import { useExercises } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'

import TemplateFormModal from '../components/TemplateFormModal'

export default function Templates() {
  const navigate = useNavigate()
  const { data: templates, isLoading: templatesLoading } = useTemplates()
  const { data: exercises } = useExercises()
  const createTemplate = useCreateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const [modalOpen, setModalOpen] = useState(false)

  if (templatesLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Workout Templates"
        subtitle={`${(templates || []).length} templates`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New Template
          </button>
        }
      />

      <div className="px-6 pb-6 space-y-2">
        {(templates || []).length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No templates yet. Create one to get started.</p>
        )}
        {(templates || []).map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/templates/${t.id}`)}
              className="flex-1 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-gray-300"
            >
              <div className="font-medium">{t.name}</div>
              {t.description && <div className="mt-1 text-xs text-gray-400">{t.description}</div>}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this template?')) deleteTemplate.mutate(t.id)
              }}
              className="rounded border border-gray-200 px-2 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        exercises={exercises || []}
        onSubmit={(data) => {
          createTemplate.mutate(data, {
            onSuccess: () => setModalOpen(false),
          })
        }}
        isPending={createTemplate.isPending}
      />
    </div>
  )
}
