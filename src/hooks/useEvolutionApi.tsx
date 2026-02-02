import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EvolutionConfig {
  instanceUrl: string;
  apiKey: string;
  instanceName: string;
}

interface EvolutionStatus {
  connected: boolean;
  qrCode: string | null;
  pairingCode: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending';
  lastCheck: Date | null;
}

interface DiagnosticLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface EvolutionContextType {
  config: EvolutionConfig;
  status: EvolutionStatus;
  logs: DiagnosticLog[];
  isConfigured: boolean;
  saveConfig: (config: EvolutionConfig) => void;
  testConnection: () => Promise<boolean>;
  verifyInstance: () => Promise<boolean>;
  generateQrCode: () => Promise<string | null>;
  generatePairingCode: () => Promise<string | null>;
  checkStatus: () => Promise<void>;
  clearLogs: () => void;
  sendWhatsAppMessage: (phone: string, message: string) => Promise<boolean>;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

const STORAGE_KEY = 'evolution_api_config';

export function EvolutionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<EvolutionConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { instanceUrl: '', apiKey: '', instanceName: '' };
  });
  
  const [status, setStatus] = useState<EvolutionStatus>({
    connected: false,
    qrCode: null,
    pairingCode: null,
    status: 'disconnected',
    lastCheck: null,
  });
  
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);

  const isConfigured = Boolean(config.instanceUrl && config.apiKey && config.instanceName);

  const addLog = (type: DiagnosticLog['type'], message: string) => {
    setLogs(prev => [{
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
    }, ...prev].slice(0, 50));
  };

  const saveConfig = (newConfig: EvolutionConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    addLog('info', 'Configuração salva localmente');
  };

  const makeRequest = async (endpoint: string, method = 'GET', body?: object) => {
    const url = `${config.instanceUrl.replace(/\/$/, '')}/${endpoint}`;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
    };
    
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão - verifique a URL e CORS');
      }
      throw error;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!isConfigured) {
      addLog('error', 'Configuração incompleta');
      return false;
    }

    addLog('info', 'Testando conexão com a API...');
    
    try {
      // Try to fetch instances to verify API connection
      const response = await makeRequest('instance/fetchInstances');
      addLog('success', `Conexão bem-sucedida! ${Array.isArray(response) ? response.length : 0} instância(s) encontrada(s)`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha na conexão: ${message}`);
      return false;
    }
  };

  const verifyInstance = async (): Promise<boolean> => {
    if (!isConfigured) {
      addLog('error', 'Configuração incompleta');
      return false;
    }

    addLog('info', `Verificando instância "${config.instanceName}"...`);
    
    try {
      const response = await makeRequest(`instance/connectionState/${config.instanceName}`);
      const state = response?.instance?.state || response?.state || 'unknown';
      
      if (state === 'open') {
        setStatus(prev => ({ ...prev, connected: true, status: 'connected' }));
        addLog('success', `Instância conectada! Estado: ${state}`);
        return true;
      } else {
        setStatus(prev => ({ ...prev, connected: false, status: 'disconnected' }));
        addLog('warning', `Instância não conectada. Estado: ${state}`);
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha ao verificar instância: ${message}`);
      return false;
    }
  };

  const generateQrCode = async (): Promise<string | null> => {
    if (!isConfigured) {
      addLog('error', 'Configuração incompleta');
      return null;
    }

    addLog('info', 'Gerando QR Code...');
    
    try {
      const response = await makeRequest(`instance/connect/${config.instanceName}`);
      const qrCode = response?.base64 || response?.qrcode?.base64 || response?.code;
      
      if (qrCode) {
        setStatus(prev => ({ ...prev, qrCode, status: 'qr_pending' }));
        addLog('success', 'QR Code gerado com sucesso!');
        return qrCode;
      } else if (response?.instance?.state === 'open') {
        setStatus(prev => ({ ...prev, connected: true, status: 'connected' }));
        addLog('success', 'Instância já está conectada!');
        return null;
      } else {
        addLog('warning', 'Resposta não contém QR Code');
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha ao gerar QR Code: ${message}`);
      return null;
    }
  };

  const generatePairingCode = async (): Promise<string | null> => {
    if (!isConfigured) {
      addLog('error', 'Configuração incompleta');
      return null;
    }

    addLog('info', 'Gerando Pairing Code...');
    
    try {
      // Evolution API endpoint for pairing code
      const response = await makeRequest(`instance/connect/${config.instanceName}`, 'POST', {
        number: '', // The phone number would be needed here
      });
      
      const pairingCode = response?.pairingCode || response?.code;
      
      if (pairingCode) {
        setStatus(prev => ({ ...prev, pairingCode, status: 'qr_pending' }));
        addLog('success', `Pairing Code: ${pairingCode}`);
        return pairingCode;
      } else {
        addLog('warning', 'Endpoint de pairing code pode não estar disponível');
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha ao gerar Pairing Code: ${message}`);
      return null;
    }
  };

  const checkStatus = async (): Promise<void> => {
    if (!isConfigured) return;

    addLog('info', 'Verificando status da conexão...');
    
    try {
      const response = await makeRequest(`instance/connectionState/${config.instanceName}`);
      const state = response?.instance?.state || response?.state || 'unknown';
      
      setStatus(prev => ({
        ...prev,
        connected: state === 'open',
        status: state === 'open' ? 'connected' : 'disconnected',
        lastCheck: new Date(),
      }));
      
      addLog(state === 'open' ? 'success' : 'warning', `Status: ${state}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha ao verificar status: ${message}`);
      setStatus(prev => ({ ...prev, connected: false, status: 'disconnected' }));
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs limpos');
  };

  const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
    if (!isConfigured) {
      toast({
        title: 'Evolution API não configurada',
        description: 'Configure a API nas configurações primeiro',
        variant: 'destructive',
      });
      return false;
    }

    if (!status.connected) {
      toast({
        title: 'WhatsApp não conectado',
        description: 'Conecte sua instância nas configurações',
        variant: 'destructive',
      });
      return false;
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      await makeRequest(`message/sendText/${config.instanceName}`, 'POST', {
        number: cleanPhone,
        text: message,
      });
      
      addLog('success', `Mensagem enviada para ${cleanPhone}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Falha ao enviar mensagem: ${errorMessage}`);
      toast({
        title: 'Falha ao enviar mensagem',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Check status on mount if configured
  useEffect(() => {
    if (isConfigured) {
      checkStatus();
    }
  }, [isConfigured]);

  return (
    <EvolutionContext.Provider value={{
      config,
      status,
      logs,
      isConfigured,
      saveConfig,
      testConnection,
      verifyInstance,
      generateQrCode,
      generatePairingCode,
      checkStatus,
      clearLogs,
      sendWhatsAppMessage,
    }}>
      {children}
    </EvolutionContext.Provider>
  );
}

export function useEvolutionApi() {
  const context = useContext(EvolutionContext);
  if (context === undefined) {
    throw new Error('useEvolutionApi must be used within an EvolutionProvider');
  }
  return context;
}
