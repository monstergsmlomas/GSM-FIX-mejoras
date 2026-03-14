import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, initAuthCreds, BufferJSON, AuthenticationState, Browsers } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { createClient } from "@supabase/supabase-js";
import pino from 'pino';

// Conexión a tu Base de Datos para guardar la sesión y prender el globito
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export let waSocket: ReturnType<typeof makeWASocket> | null = null;
export let currentQr: string | null = null;
export let connectionStatus: 'disconnected' | 'qr' | 'connected' = 'disconnected';

export const getWaStatus = () => connectionStatus;
export const getWaQr = () => currentQr;

async function useSupabaseAuthState(sessionId: string) {
    const writeData = async (data: any, id: string) => {
        const dataStr = JSON.stringify(data, BufferJSON.replacer);
        await supabase.from('wa_sessions').upsert({ id: `${sessionId}_${id}`, session_data: dataStr });
    };

    const readData = async (id: string) => {
        const { data } = await supabase.from('wa_sessions').select('session_data').eq('id', `${sessionId}_${id}`).maybeSingle();
        if (data?.session_data) {
            return JSON.parse(data.session_data, BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (id: string) => {
        await supabase.from('wa_sessions').delete().eq('id', `${sessionId}_${id}`);
    };

    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: { [_: string]: any } = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`);
                            if (value) data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        } as AuthenticationState,
        saveCreds: () => writeData(creds, 'creds'),
        clearSession: async () => {
            await supabase.from('wa_sessions').delete().like('id', `${sessionId}_%`);
        }
    };
}

export async function connectToWhatsApp() {
    console.log("🚀 Iniciando motor de WhatsApp (Versión Anti-Ban + Debug)...");
    
    if (waSocket) {
        waSocket = null;
    }
    
    try {
        const { state, saveCreds, clearSession } = await useSupabaseAuthState('gsmfix');
        const { version } = await fetchLatestBaileysVersion();

        waSocket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }), 
            // 👇 Truco de seguridad: Simulamos ser un Chrome en Ubuntu real
            browser: Browsers.ubuntu('Chrome'), 
        });

        waSocket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                connectionStatus = 'qr';
                currentQr = await QRCode.toDataURL(qr);
            }

            if (connection === 'close') {
                currentQr = null;
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const errorMessage = (lastDisconnect?.error as any)?.message || "Sin mensaje";
                
                // 👇 CHISMOSO DE ERRORES: Nos dice exactamente por qué WhatsApp nos patea
                console.log(`⚠️ Desconexión. Código WhatsApp: ${statusCode} | Motivo: ${errorMessage}`);
                
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                waSocket = null;
                
                if (shouldReconnect) {
                    connectionStatus = 'disconnected';
                    console.log('🔄 Reconectando motor en 5 segundos...');
                    setTimeout(connectToWhatsApp, 5000); 
                } else {
                    connectionStatus = 'disconnected';
                    console.log('🚪 Sesión cerrada o inválida. Borrando datos...');
                    await clearSession();
                    setTimeout(connectToWhatsApp, 2000);
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                currentQr = null;
                console.log('✅ ¡Motor de WhatsApp Conectado y Listo!');
            }
        });

        // 👇 EL RADAR DE MENSAJES (Filtro anti-spam, estados y GRUPOS) 👇
        waSocket.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    
                    const myNumber = waSocket?.user?.id?.split(':')[0];
                    const senderNumber = msg.key.remoteJid?.split('@')[0];
                    const isStatus = msg.key.remoteJid === 'status@broadcast';
                    // NUEVO: Verificamos si el mensaje viene de un Grupo de WhatsApp
                    const isGroup = msg.key.remoteJid?.endsWith('@g.us');

                    // Si NO lo enviaste vos, NO sos vos mismo, NO es un estado y NO es un grupo
                    if (!msg.key.fromMe && senderNumber !== myNumber && !isStatus && !isGroup) {
                        console.log(`\n==========================================`);
                        console.log(`📩 ALARMA: MENSAJE RECIBIDO DE ${msg.key.remoteJid}`);
                        console.log(`==========================================\n`);
                        
                        try {
                            await supabase
                                .from('bot_settings')
                                .update({ has_unread_messages: true })
                                .neq('id', '0'); 
                        } catch (err) {
                            console.error("Error prendiendo el globito en BD:", err);
                        }
                    }
                }
            }
        });

        waSocket.ev.on('creds.update', saveCreds);
    } catch (error) {
        console.error("❌ Error grave al iniciar Baileys:", error);
    }
}

export async function disconnectWhatsApp() {
    if (waSocket) {
        waSocket.logout();
    }
}

export async function sendWhatsAppMessage(phone: string, text: string) {
    if (connectionStatus !== 'connected' || !waSocket) return false;
    try {
        let cleanPhone = phone.replace(/\D/g, ''); 
        if (cleanPhone.length === 10) {
            cleanPhone = `549${cleanPhone}`;
        }
        
        const possibleJid = `${cleanPhone}@s.whatsapp.net`;
        const waResult = await waSocket.onWhatsApp(possibleJid);
        const result = waResult?.[0];

        if (!result || !result.exists) return false;

        await waSocket.sendMessage(result.jid, { text });
        console.log(`✅ Mensaje entregado al JID: ${result.jid}`);
        return true;
    } catch (error) {
        console.error('❌ Error disparando mensaje:', error);
        return false;
    }
}