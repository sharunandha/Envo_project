@echo off
set nodePath=C:\nodejs\node-v18.18.0-win-x64
set PATH=%nodePath%;%PATH%
cd /d c:\Users\HP\Desktop\Environment_project\backend
"%nodePath%\node.exe" server.js
