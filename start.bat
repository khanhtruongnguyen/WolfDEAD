@echo off
chcp 65001 >nul
title WolfDEAD - Game Ma Soi AI
echo ========================================================
echo       WOLFDEAD v3.2 - GAME MA SOI OFFLINE DAU VOI AI
echo ========================================================
echo.
echo Ban co the double-click truc tiep vao file "index.html"
echo trong thu muc nay de mo game va choi ngay lap tuc!
echo.
echo Dang khoi dong may chu local tai http://localhost:8080 ...
start http://localhost:8080
python server.py
pause
