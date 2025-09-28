@echo off
echo Starting BitBreez Chatbox Server with Resend...
set RESEND_API_KEY=re_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP
set HANDOVER_EMAIL=ibrahim_benyahya@hotmail.com
echo Environment variables set:
echo RESEND_API_KEY: %RESEND_API_KEY%
echo HANDOVER_EMAIL: %HANDOVER_EMAIL%
echo.
echo Starting server...
node server.js

