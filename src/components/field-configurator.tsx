"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { FieldConfig } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"
import { reorderFieldConfigs, deleteFieldConfig } from "@/app/actions/field"

interface FieldConfiguratorProps {
    projectId: string
    initialFields: FieldConfig[]
}

export function FieldConfigurator({ projectId, initialFields }: FieldConfiguratorProps) {
    const [fields, setFields] = useState<FieldConfig[]>(initialFields)
    const [isClient, setIsClient] = useState(false)

    // Avoid hydration mismatch by waiting for client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        setFields(initialFields)
    }, [initialFields])

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const sourceIndex = result.source.index
        const destinationIndex = result.destination.index

        if (sourceIndex === destinationIndex) return

        const newFields = Array.from(fields)
        const [reorderedItem] = newFields.splice(sourceIndex, 1)
        newFields.splice(destinationIndex, 0, reorderedItem)

        setFields(newFields)

        // Fire server action to persist
        const newOrderIds = newFields.map((f) => f.id)
        await reorderFieldConfigs(projectId, newOrderIds)
    }

    const handleDelete = async (id: string) => {
        if (confirm("Möchtest du dieses Feld wirklich löschen?")) {
            await deleteFieldConfig(id, projectId)
        }
    }

    if (!isClient) return <div>Lade Konfigurator...</div>

    if (fields.length === 0) {
        return <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">Keine Felder konfiguriert.</div>
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="field-list">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided) => (
                                    <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="p-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div {...provided.dragHandleProps} className="text-muted-foreground">
                                                <GripVertical className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{field.name}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span className="bg-muted px-1.5 py-0.5 rounded">{field.type}</span>
                                                    <span className="bg-muted px-1.5 py-0.5 rounded">{field.internalKey}</span>
                                                    {field.isRequired && <span className="text-destructive font-medium">Pflichtfeld</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive"
                                            onClick={() => handleDelete(field.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </Card>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}
