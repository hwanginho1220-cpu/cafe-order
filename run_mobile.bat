@echo off
chcp 65001 > nul
title 모두의 음료 - 모바일 & PC 서버
python "%~dp0server.py"
pause
