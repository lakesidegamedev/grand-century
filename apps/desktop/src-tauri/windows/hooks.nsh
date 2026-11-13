; Installer hooks for the Windows NSIS bundle.
; The product name stays "GrandCentury" so file names and the install folder do
; not change; the Apps list shows the spaced display name.
!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayName" "Grand Century"
!macroend
