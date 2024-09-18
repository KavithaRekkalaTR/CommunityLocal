#Requires -Version 3.0
<#
	.Description
		Installs the Telligent Community Job Service
		
	.Example
		.\Install.ps1
		Installs the Job Service as the 'TelligentCommunityJobService' service.
		
	.Example
		.\Install.ps1 -ServiceName 'MyCommunityJobServer' -DisplayName 'MyCommunity Job Server'
		Installs the Job Service using a custom service name and port.
				
	.Parameter ServiceName
		The name to use when creating the windows service.  Defaults to 'TelligentCommunityJobService'.
		Must be provided if DisplayName is provided.
	.Parameter DisplayName
		The display name to use when creating the windows service.  Defaults to 'Telligent Community Job Service'.
		Must be provided if ServiceName is provided.
	.Parameter DisplayName
		The credentials to run the service account under. If not specified, uses a service specific virtual
        account "NT SERVICE\$ServiceName".
	.Parameter Force
		Force the service installation, even if configuration validation fails.
#>
param (
	[string]$ServiceName = 'TelligentCommunityJobService',
	[string]$DisplayName = 'Telligent Community Job Service',
	[PSCredential]$Credential = (new-object PSCredential "NT SERVICE\$ServiceName", (new-object System.Security.SecureString)),
    [switch]$Force
)

#Prerequisites
$script:ErrorActionPreference = 'Stop'
$JSRoot = $PSScriptRoot
$serviceDescription = "Job Service for Telligent Community"
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
	Write-Error 'You must be running as an administrator to install Telligent Job Service'
}

if (Get-Service $ServiceName -ea SilentlyContinue) {
    Write-Warning "Service '$ServiceName' already exists." -ErrorAction Continue
    Write-Warning "Use Uninstall.ps1 to uninstall this existing instance"
    Write-Warning "To install an additional instance, re-run this script with the ServiceName and DisplayName parameters"
    return
}

#Helper function to validate an external command completed successfully
function Exec {
	param(
		[Parameter(Mandatory=$true)]
		[scriptblock]$Command
	)
	Write-Debug "Running $command"
	& $Command

	if($LASTEXITCODE) {
		Write-Error "Exit Code $LASTEXITCODE whilst running $Command"
	}
}

try {
	Write-Host 'Unblocking files' -ForegroundColor Cyan
	Get-ChildItem $PSScriptRoot -recurse | Unblock-File
	

    Write-Host 'Validating Filestorage' -ForegroundColor Cyan
    $filestoragePath = ([xml](Get-Content connectionStrings.config)).connectionStrings.add |
        ? name -eq FileStorage |
        select -ExpandProperty ConnectionString

    if ($filestoragePath.StartsWith('~')) {
        Write-Warning "Using relative path for Filestorage"
        $filestoragePath = Join-Path $PSScriptRoot $filestoragePath.TrimStart('~').Replace('/', '\').TrimStart('\')
    }

    if (-not (Test-Path $filestoragePath)) {
        if ($Force) {
            Write-Warning 'Unable to validate Filestorage path'
        }
        else {
            Write-Error "'$filestoragePath' does not contain a valid Tellgient Community filestorage"
        }
    }
    else {
        Write-Host "Using filestorage '$filestoragePath'"
    }


	Write-Host 'Creating Log directory'  -ForegroundColor Cyan
	$logPath = Join-Path $JSRoot logs
	if(-not(Test-Path $logPath)){
		New-Item $logPath -Type Directory | out-null
	}
	
    
	$ServiceAccount = $Credential.Username
	Write-Host "Installing Service running as '$ServiceAccount'" -ForegroundColor Cyan

	$servicePath = Join-Path $JSRoot Telligent.Jobs.Server.exe

	#New-Service doesn't support Managed Service accounts on it's Credential object, so call sc.exe directly for these
	$servicePath = Join-Path $JSRoot Telligent.Jobs.Server.exe
	if ($Credential -and $Credential.Password.Length -eq 0) {
		exec { sc.exe create "$ServiceName" binPath= "$ServicePath" DisplayName= "$DisplayName" start= auto obj= "$($credential.UserName)" }
		exec { sc.exe description "$ServiceName" "$serviceDescription" }		
	}
	else {
		New-Service $ServiceName `
			-BinaryPathName $servicePath `
			-DisplayName $DisplayName `
			-StartupType Automatic `
			-Credential $credential `
			-Description serviceDescription | Out-Null
	}	

	Write-Host "Granting file system permissions for '$ServiceAccount'" -ForegroundColor Cyan
	Exec { icacls $JSRoot /grant "${ServiceAccount}:(OI)(CI)RX" }
	Exec { icacls $logPath /grant "${ServiceAccount}:(OI)(CI)M" }
    if ($filestoragePath -and (Test-Path $filestoragePath)) {
        Write-Host "Granting Modify permissions to '$ServiceAccount' on '$filestoragePath'"
    	Exec { icacls $filestoragePath /grant "${ServiceAccount}:(OI)(CI)M" }
    }
}
catch {
	if(Get-Service $ServiceName -ea SilentlyContinue) {
		Write-Warning "Installation failed - rolling back service installation"
		&"$PSScriptRoot\Uninstall.ps1" -ServiceName $ServiceName
	}
	throw
}

Start-Service $ServiceName
