import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2, ArrowRightLeft, Download, X, Mail } from "lucide-react";
import { stageConfig } from "@/pages/Leads";
import { BulkEmailModal } from "@/components/campaigns/BulkEmailModal";

interface BulkActionsProps {
    selectedLeads: string[];
    onClearSelection: () => void;
    className?: string;
}

export function BulkActions({ selectedLeads, onClearSelection, className }: BulkActionsProps) {
    const [isActing, setIsActing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const queryClient = useQueryClient();

    // Mover Estágio
    const handleBulkMove = async (newStage: string) => {
        setIsActing(true);
        try {
            const { error } = await supabase
                .from('leads')
                .update({ stage: newStage })
                .in('id', selectedLeads);

            if (error) throw error;

            toast({
                title: "Leads movidos!",
                description: `${selectedLeads.length} leads foram movidos para ${stageConfig[newStage]?.label || newStage}.`,
            });

            await queryClient.invalidateQueries({ queryKey: ['leads'] });
            onClearSelection();
        } catch (e: any) {
            toast({ title: "Erro ao mover leads", description: e.message, variant: "destructive" });
        } finally {
            setIsActing(false);
        }
    };

    // Excluir Leads
    const handleBulkDelete = async () => {
        setIsActing(true);
        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', selectedLeads);

            if (error) throw error;

            toast({
                title: "Leads excluídos!",
                description: `${selectedLeads.length} leads foram removidos.`,
            });

            await queryClient.invalidateQueries({ queryKey: ['leads'] });
            onClearSelection();
            setShowDeleteDialog(false);
        } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
        } finally {
            setIsActing(false);
        }
    };

    // Exportar CSV Manual
    const handleExport = async () => {
        setIsActing(true);
        try {
            // Buscar dados dos leads selecionados
            const { data: leads, error } = await supabase
                .from('leads')
                .select('*')
                .in('id', selectedLeads);

            if (error) throw error;
            if (!leads || leads.length === 0) throw new Error("Nenhum dado encontrado para exportar");

            // Gerar XLS (Tabela HTML compatível com Excel)
            const tableContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>
                                <th>Business Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Website</th>
                                <th>Instagram</th>
                                <th>Stage</th>
                                <th>Lead Score</th>
                                <th>City</th>
                                <th>State</th>
                                <th>Rating</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leads.map(lead => `
                                <tr>
                                    <td>${lead.business_name || ''}</td>
                                    <td>${lead.phone || ''}</td>
                                    <td>${lead.email || ''}</td>
                                    <td>${lead.website_url || ''}</td>
                                    <td>${lead.instagram_url || ''}</td>
                                    <td>${stageConfig[lead.stage || 'new']?.label || lead.stage}</td>
                                    <td>${lead.lead_score || 0}</td>
                                    <td>${lead.city || ''}</td>
                                    <td>${lead.state || ''}</td>
                                    <td>${lead.rating || ''}</td>
                                    <td>${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.xls`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Exportação XLS concluída", description: `${leads.length} leads exportados.` });
            onClearSelection();
        } catch (e: any) {
            toast({ title: "Erro na exportação", description: e.message, variant: "destructive" });
        } finally {
            setIsActing(false);
        }
    };

    if (selectedLeads.length === 0) return null;

    return (
        <>
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 border border-border/50 ${className}`}>
                <div className="flex items-center gap-3 border-r border-background/20 pr-4">
                    <span className="font-medium whitespace-nowrap text-sm">{selectedLeads.length} selecionados</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-background/20 text-background/80 hover:text-background" onClick={onClearSelection}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Agendar Sequência */}
                    <Button
                        variant="default"
                        size="sm"
                        disabled={isActing}
                        className="gap-2 h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => setShowEmailModal(true)}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        Agendar Sequência
                    </Button>

                    {/* Mover */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" disabled={isActing} className="gap-2 h-8">
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                Mover
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {Object.entries(stageConfig).map(([key, config]) => (
                                <DropdownMenuItem key={key} onClick={() => handleBulkMove(key)}>
                                    {config.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Exportar */}
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isActing}
                        className="gap-2 h-8"
                        onClick={handleExport}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar
                    </Button>

                    {/* Excluir */}
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isActing}
                        className="gap-2 h-8"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                    </Button>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente {selectedLeads.length} leads e todos os dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isActing}
                        >
                            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BulkEmailModal
                open={showEmailModal}
                onOpenChange={setShowEmailModal}
                selectedLeads={selectedLeads}
                onSuccess={onClearSelection}
            />
        </>
    );
}
