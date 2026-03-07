import { useState, useEffect } from "react"
import { Menu, X, Plus } from "lucide-react"

import DashboardSidebar from "../../../components/layout/DashboardSideBar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/Tabs"
import { useToast } from "../../../hooks/use-toast"

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

export default function HealingContentPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
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
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? "block" : "hidden"
                    } lg:static lg:block`}
            >
                <DashboardSidebar
                    userType="admin"
                    onClose={() => setSidebarOpen(false)}
                />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="shrink-0 z-10 bg-white border-b shadow-sm">
                    <div className="px-4 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Healing Content Library</h1>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-muted rounded-lg"
                        >
                            {sidebarOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </header>

                {/* Content Body */}
                <main className="flex-1 overflow-y-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground">Manage healing resources to help users relax and improve their mood.</p>

                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                            >
                                <Plus size={18} />
                                Add Content
                            </button>
                        </div>

                        <Tabs
                            defaultValue="quote"
                            value={activeTab}
                            onValueChange={(value) => setActiveTab(value as 'quote' | 'video' | 'article')}
                            className="w-full"
                        >
                            <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md">
                                <TabsTrigger value="quote">Quotes</TabsTrigger>
                                <TabsTrigger value="video">Exercise Videos</TabsTrigger>
                                <TabsTrigger value="article">Articles</TabsTrigger>
                            </TabsList>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                </main>
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
        </div>
    )
}
