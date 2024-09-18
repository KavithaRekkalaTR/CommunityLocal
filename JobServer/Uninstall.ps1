#Requires -Version 3.0
<#
    .Description
		Uninstalls the Telligent Community Job Server

	.Parameter ServiceName
		The name of the Telligent Community Job Server instance you want to uninstall. Defaults to 'TelligentCommunityJobService'.
		
	.Example
		.\Uninstall.ps1

		Uninstalls the default 'TelligentCommunityJobService' service.

	.Example
		.\Uninstall.ps1 -ServiceName 'MyCommunityJobs'

		Uninstalls the Job Service named 'MyCommunityJobs'.
#>
param (
	[string]$ServiceName = 'TelligentCommunityJobService'
)

$script:ErrorActionPreference = 'Stop'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error 'You must be running as an administrator to uninstall Job Server for Telligent Community'
}

if (Get-Service $ServiceName -ea SilentlyContinue) {
    Stop-Service $ServiceName
	
	&sc.exe delete $ServiceName
}
else {
    Write-Warning "Service $serviceName does not exist"
}

