import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/Tabs"
import { useToast } from "../../../hooks/use-toast"
import { Button } from "../../../components/ui/Button"
import type { HealingContent } from "../../../services/healingContentService"
import {
    getHealingContent,
    createHealingContent,
    updateHealingContent,
    deleteHealingContent,
} from "../../../services/healingContentService"
import HealingContentTable from "../../../components/admin/healing/HealingContentTable"
import HealingContentFormModal from "../../../components/admin/healing/HealingContentFormModal"
import HealingContentDetailModal from "../../../components/admin/healing/HealingContentDetailModal"
import DeleteConfirmModal from "../../../components/admin/healing/DeleteConfirmModal"
import DashboardLayout from "../../../components/layout/DashboardLayout"

export default function HealingContentPage() {
    const [activeTab, setActiveTab] = useState<'quote' | 'video' | 'article'>('quote')
    const [contents, setContents] = useState<HealingContent[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedContent, setSelectedContent] = useState<HealingContent | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { toast } = useToast()

    const fetchContents = async (type: 'quote' | 'video' | 'article') => {
        setIsLoading(true)
        try {
            const data = await getHealingContent(type)
            setContents(data)
        } catch (error) {
            console.error("Failed to fetch healing content", error)
            toast({
                title: "Error",
                description: "Failed to load healing content. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchContents(activeTab)
    }, [activeTab])

    const handleOpenAddModal = () => {
        setSelectedContent(null)
        setIsFormModalOpen(true)
    }

    const handleOpenEditModal = (content: HealingContent) => {
        setSelectedContent(content)
        setIsFormModalOpen(true)
    }

    const handleOpenDetailModal = (content: HealingContent) => {
        setSelectedContent(content)
        setIsDetailModalOpen(true)
    }

    const handleOpenDeleteModal = (content: HealingContent) => {
        setSelectedContent(content)
        setIsDeleteModalOpen(true)
    }

    const handleFormSubmit = async (data: FormData | Record<string, any>) => {
        setIsSubmitting(true)
        try {
            if (selectedContent) {
                await updateHealingContent(selectedContent._id, data)
                toast({
                    title: "Success",
                    description: "Healing content updated successfully.",
                })
            } else {
                await createHealingContent(data)
                toast({
                    title: "Success",
                    description: "Healing content created successfully.",
                })
            }
            setIsFormModalOpen(false)
            fetchContents(activeTab)
        } catch (error) {
            console.error("Form submit error", error)
            toast({
                title: "Error",
                description: "Failed to save healing content.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedContent) return

        setIsSubmitting(true)
        try {
            await deleteHealingContent(selectedContent._id)
            toast({
                title: "Success",
                description: "Healing content deleted successfully.",
            })
            setIsDeleteModalOpen(false)
            fetchContents(activeTab)
        } catch (error) {
            console.error("Delete error", error)
            toast({
                title: "Error",
                description: "Failed to delete healing content.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <DashboardLayout 
            title="Healing Content Library" 
            userType="admin"
            headerActions={
                <Button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-0 shadow-md"
                    size="sm"
                >
                    <Plus size={18} />
                    Add Content
                </Button>
            }
        >
            <div className="px-4 py-8 max-w-6xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Resource Management</h2>
                    <p className="text-muted-foreground text-sm">Manage healing resources to help users relax and improve their mood.</p>
                </div>

                <Tabs
                    defaultValue="quote"
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'quote' | 'video' | 'article')}
                    className="w-full"
                >
                    <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md bg-secondary/50 rounded-xl p-1">
                        <TabsTrigger value="quote" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Quotes</TabsTrigger>
                        <TabsTrigger value="video" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Videos</TabsTrigger>
                        <TabsTrigger value="article" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Articles</TabsTrigger>
                    </TabsList>

                    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                                <p className="text-muted-foreground text-sm">Loading resources...</p>
                            </div>
                        ) : (
                            <>
                                <TabsContent value="quote" className="mt-0 outline-none">
                                    <HealingContentTable
                                        type="quote"
                                        contents={contents}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleOpenDeleteModal}
                                        onView={handleOpenDetailModal}
                                    />
                                </TabsContent>
                                <TabsContent value="video" className="mt-0 outline-none">
                                    <HealingContentTable
                                        type="video"
                                        contents={contents}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleOpenDeleteModal}
                                        onView={handleOpenDetailModal}
                                    />
                                </TabsContent>
                                <TabsContent value="article" className="mt-0 outline-none">
                                    <HealingContentTable
                                        type="article"
                                        contents={contents}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleOpenDeleteModal}
                                        onView={handleOpenDetailModal}
                                    />
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Modals */}
            <HealingContentFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedContent}
                type={activeTab}
                isSubmitting={isSubmitting}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isDeleting={isSubmitting}
                title={selectedContent?.title ? `"${selectedContent.title}"` : 'this content'}
            />

            <HealingContentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                content={selectedContent}
            />
        </DashboardLayout>
    )
}
