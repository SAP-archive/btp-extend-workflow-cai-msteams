
/**
 * index.js is used to setup the whole Microsoft Teams extension application
 * It defines the available routes for bot messages, API calls, notifications and static content
 */

// Import required packages
import path from 'path'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url';

// Import environment variables and routers
import './loadEnv.js'
import { appRouter, notifyRouter } from './server/api/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4001;

// Create HTTP server
const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.resolve(__dirname, './client/build')))

// Load bot framwork adapter and bot activity handler
import adapter from './server/bots/botAdapter.js'
import botActivityHandler from './server/bots/botActivityHandler.js'

// Import filters (passport strategies) to authenticate requests
import {teamsFilter} from './server/filters/teamsFilter.js'
import {xsuaaFilter} from './server/filters/xsuaaFilter.js'

// bot endpoint which is handling bot interaction
server.post('/api/messages', async (req, res) => { await adapter.process(req, res, (context) => botActivityHandler.run(context)) })

// api endpoints used by client app (React component e.g. used for task module)
// only give access to requests containing a valid Azure AD context
server.use('/api', teamsFilter.auth(), appRouter)

// notification endpoint
// only give access to requests providing valid XSUAA client credentials
server.use('/notify', xsuaaFilter.auth(), notifyRouter)

// static web files
// not secured as only static web content provided
server.get('*', (req, res) => res.sendFile(path.resolve(__dirname, './client/build', 'index.html')));

server.listen(PORT, () => { console.log(`Server listening on http://localhost:${ PORT }`)});
