
/**
 * index.js exports the available express routers providing 
 * - a route used for the notification handling
 * - routes used by the client app (React component)
 */

// Notification router
import notifyRouter from './router/notifyRouter.js'
// Client app (React component) router
import appRouter from './router/appRouter.js'

export { appRouter, notifyRouter }
