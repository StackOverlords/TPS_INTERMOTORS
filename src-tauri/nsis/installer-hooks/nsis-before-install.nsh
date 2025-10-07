; Hook NSIS - Ejecutado antes de la instalación principal
; Este script instala OpenVPN automáticamente

!include LogicLib.nsh
!include FileFunc.nsh

Section "OpenVPN Installation"
    ; Mostrar mensaje de progreso
    DetailPrint "Instalando OpenVPN y configurando VPN..."

    ; Verificar si ya está instalado OpenVPN
    ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OpenVPN" "DisplayName"
    ${If} $0 != ""
        DetailPrint "OpenVPN ya está instalado, omitiendo..."
        Goto SkipOpenVPNInstall
    ${EndIf}

    ; Ejecutar script PowerShell con privilegios elevados
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -Command "Start-Process powershell.exe -ArgumentList \"-ExecutionPolicy Bypass -File `\"$INSTDIR\install-openvpn.ps1`\" -AppDir `\"$INSTDIR`\"\" -Verb RunAs -Wait"'
    Pop $0

    ${If} $0 != 0
        MessageBox MB_ICONEXCLAMATION|MB_OK "Error instalando OpenVPN. El sistema funcionará pero requerirá configuración manual de VPN.$\nCódigo de error: $0"
        ; No cancelar la instalación, solo mostrar advertencia
    ${Else}
        DetailPrint "OpenVPN instalado y configurado exitosamente"
    ${EndIf}

    SkipOpenVPNInstall:

SectionEnd