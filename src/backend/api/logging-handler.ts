import { Request, Response } from 'express';
import { 
    getLoggingMetrics, 
    getConversationLogs, 
    getTenantLogs, 
    logConversationStart, 
    logAIResponse, 
    logError, 
    cleanupOldLogs 
} from './logging.js';

export class LoggingHandler {
    async handleRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route logging requests
            if (path === '/logging/metrics') {
                return await getLoggingMetrics(request, {} as Response);
            }

            if (path.startsWith('/logging/conversation/') && path.endsWith('/logs')) {
                const conversationId = path.split('/')[3];
                request.params = { conversationId };
                return await getConversationLogs(request, {} as Response);
            }

            if (path === '/logging/tenant/logs') {
                return await getTenantLogs(request, {} as Response);
            }

            if (path === '/logging/conversation/start') {
                if (request.method !== 'POST') {
                    return new Response(JSON.stringify({
                        error: 'Method not allowed',
                        code: 'METHOD_NOT_ALLOWED'
                    }), {
                        status: 405,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
                return await logConversationStart(request, {} as Response);
            }

            if (path === '/logging/ai/response') {
                if (request.method !== 'POST') {
                    return new Response(JSON.stringify({
                        error: 'Method not allowed',
                        code: 'METHOD_NOT_ALLOWED'
                    }), {
                        status: 405,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
                return await logAIResponse(request, {} as Response);
            }

            if (path === '/logging/error') {
                if (request.method !== 'POST') {
                    return new Response(JSON.stringify({
                        error: 'Method not allowed',
                        code: 'METHOD_NOT_ALLOWED'
                    }), {
                        status: 405,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
                return await logError(request, {} as Response);
            }

            if (path === '/logging/cleanup') {
                if (request.method !== 'POST') {
                    return new Response(JSON.stringify({
                        error: 'Method not allowed',
                        code: 'METHOD_NOT_ALLOWED'
                    }), {
                        status: 405,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
                return await cleanupOldLogs(request, {} as Response);
            }

            // 404 for unknown logging routes
            return new Response(JSON.stringify({
                error: 'Logging endpoint not found',
                code: 'NOT_FOUND'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            console.error('Logging Handler Error:', error);
            return new Response(JSON.stringify({
                error: 'Internal logging error',
                code: 'INTERNAL_ERROR'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
}
