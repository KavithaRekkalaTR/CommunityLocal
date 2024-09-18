<#
    .Description
		Uninstalls the search component for Telligent Community

	.Parameter ServiceName
		The name of the Telligent Search instance to uninstall. Defaults to 'TelligentSearch'.
		
	.Example
		.\ServiceUninstall.ps1

		Uninstalls the default 'TelligentSearch' service.

	.Example
		.\ServiceUninstall.ps1 -ServiceName 'MyCommunitySearch'

		Uninstalls the default 'TelligentSearch' service.
#>
#Requires -Version 3.0
param (
	[string]$ServiceName = 'TelligentSearch'
)

$script:ErrorActionPreference = 'Stop'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error 'You must be running as an administrator to uninstall Solr for Telligent Community'
}

if (Get-Service $ServiceName -ea SilentlyContinue) {
    Stop-Service $ServiceName

    $nssmExe = if([Environment]::Is64BitOperatingSystem) { "$PSScriptRoot\nssm-x64.exe" } else { "$PSScriptRoot\nssm-x86.exe" }

    &$nssmExe remove "$ServiceName" confirm
}
else {
    Write-Warning "Service $serviceName does not exist"
}

