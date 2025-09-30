import { Request, Response } from 'express';
import { 
    getDashboardMetrics, 
    getAILatencyMetrics, 
    getHandoverMetrics, 
    getRealTimeMetrics, 
    recordAIResponse, 
    recordHandover, 
    cleanupOldMetrics 
} from './monitoring.js';

export class MonitoringHandler {
    async handleRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route monitoring requests
            if (path === '/monitoring/dashboard') {
                return await getDashboardMetrics(request, {} as Response);
            }

            if (path === '/monitoring/ai/latency') {
                return await getAILatencyMetrics(request, {} as Response);
            }

            if (path === '/monitoring/handover') {
                return await getHandoverMetrics(request, {} as Response);
            }

            if (path === '/monitoring/realtime') {
                return await getRealTimeMetrics(request, {} as Response);
            }

            if (path === '/monitoring/ai/record') {
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
                return await recordAIResponse(request, {} as Response);
            }

            if (path === '/monitoring/handover/record') {
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
                return await recordHandover(request, {} as Response);
            }

            if (path === '/monitoring/cleanup') {
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
                return await cleanupOldMetrics(request, {} as Response);
            }

            // 404 for unknown monitoring routes
            return new Response(JSON.stringify({
                error: 'Monitoring endpoint not found',
                code: 'NOT_FOUND'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            console.error('Monitoring Handler Error:', error);
            return new Response(JSON.stringify({
                error: 'Internal monitoring error',
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
