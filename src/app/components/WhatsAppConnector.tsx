import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  LogOut, 
  Loader2,
  RefreshCw,
  Smartphone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface WhatsAppConnectorProps {
  status: string;
  isPaused: boolean;
  onLogout: () => Promise<void>;
  onTogglePause: () => Promise<void>;
}

export function WhatsAppConnector({ status, isPaused, onLogout, onTogglePause }: WhatsAppConnectorProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQr = async () => {
    setLoadingQr(true);
    try {
      const res = await fetch("http://localhost:8000/api/wa/qr");
      const data = await res.json();
      if (data.qr) {
        setQrCodeData(data.qr);
      }
    } catch (err) {
      console.error("Failed to fetch QR", err);
      toast.error("Ошибка загрузки QR-кода");
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && (status === "disconnected" || status === "qr_ready")) {
      fetchQr();
    }
  }, [isModalOpen, status]);

  useEffect(() => {
    // If we transition to connected while modal is open, close it
    if (status === "connected" && isModalOpen) {
      setIsModalOpen(false);
      toast.success("WhatsApp успешно подключен!");
    }
  }, [status, isModalOpen]);

  const handleLogout = async () => {
    try {
      await onLogout();
      toast.info("WhatsApp отключен");
    } catch (err) {
      toast.error("Не удалось отключить WhatsApp");
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${
          status === 'connected' 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
        }`}>
          {status === 'connected' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>WhatsApp Подключен</span>
            </>
          ) : status === 'qr_ready' ? (
            <>
              <QrCode className="w-4 h-4 animate-pulse" />
              <span>Сканируйте QR</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              <span>Подключить WhatsApp</span>
            </>
          )}
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-3xl p-8 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            {status === 'connected' ? "Ваш WhatsApp подключен" : "Подключение WhatsApp"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-slate-400 font-medium">
            {status === 'connected' 
              ? "Система получает уведомления из ваших чатов в режиме реального времени."
              : "Откройте WhatsApp на телефоне → Настройки → Связанные устройства → Привязка устройства."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          {status === 'connected' ? (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-4 border-green-500 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-900 dark:text-white font-bold text-lg">Статус: {isPaused ? "Приостановлен" : "Активен"}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {isPaused ? "Уведомления и команды ИИ сейчас не обрабатываются." : "Все входящие сообщения анализируются ИИ"}
                </p>
              </div>
              <div className="w-full flex gap-3">
                <Button 
                  variant={isPaused ? "default" : "secondary"}
                  onClick={onTogglePause}
                  className="w-full h-12 rounded-xl font-bold uppercase tracking-widest gap-2 flex-1"
                >
                  {isPaused ? "Возобновить" : "Приостановить"}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="h-12 rounded-xl font-bold uppercase tracking-widest gap-2 flex-1"
                >
                  <LogOut className="w-4 h-4" />
                  Отвязать
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800">
                {loadingQr ? (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                ) : qrCodeData ? (
                  <img 
                    src={qrCodeData} 
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64 rounded-lg pointer-events-none"
                  />
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-center gap-4">
                    <Smartphone className="w-12 h-12 text-gray-300" />
                    <p className="text-sm text-gray-500">Ожидание QR-кода от сервиса...</p>
                    <Button variant="ghost" size="sm" onClick={fetchQr} className="gap-2">
                      <RefreshCw className="w-4 h-4" /> Обновить
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Overlay pulse if ready */}
              {!loadingQr && qrCodeData && status === 'disconnected' && (
                <div className="absolute -inset-1 bg-blue-500/10 rounded-3xl animate-pulse -z-10 blur-sm"></div>
              )}
            </div>
          )}
        </div>

        {status !== 'connected' && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
              Не закрывайте это окно до завершения сканирования. Статус обновится автоматически сразу после входа.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
