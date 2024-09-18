<#
	.Description
		Installs the search component for Telligent Community
		
	.Example
		.\ServiceInstall.ps1

		Installs Telligent Search as the 'TelligentSearch' service running on port 8983.
		
	.Example
		.\ServiceInstall.ps1 -ServiceName 'MyCommunitySearch' -DisplayName 'MyCommunity Search' -Port 6789

		Installs Telligent Search using a custom service name and port.
				
	.Parameter ServiceName
		The name to use when creating the windows service.  Defaults to 'TelligentSearch'.
		Must be provided with DisplayName.

	.Parameter DisplayName
		The display name to use when creating the windows service.  Defaults to 'Telligent Search'.
		Must be provided with ServiceName.

	.Parameter Port
		The port to run solr on. Defaults to 8983.

#>
#Requires -Version 3.0
param (
	[string]$ServiceName = 'TelligentSearch',
	[string]$DisplayName = 'Telligent Search',
	[uint16]$Port = 8983
)

#Prerequisites
$script:ErrorActionPreference = 'Stop'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
	Write-Error 'You must be running as an administrator to install Solr Search for Telligent Community'
}

if (Get-Service $ServiceName -ea SilentlyContinue) {
    Write-Warning "Service '$ServiceName' already exists." -ErrorAction Continue
    Write-Warning "Use ServiceUninstall.ps1 to uninstall this existing instance"
    Write-Warning "If you want to run an additional community, consider setting up new cores on an existing search instance instead."
    Write-Warning "Alternatively, re-run this script providing ServiceName and Port paramaters to install a new search instance."
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

$startAt = Get-Date

try {
	$SolrRoot = Resolve-Path $PSScriptRoot\..

	$nssmExe = if([Environment]::Is64BitOperatingSystem) { "$PSScriptRoot\nssm-x64.exe" } else { "$PSScriptRoot\nssm-x86.exe" }

	$solrCommand = Join-Path $SolrRoot bin\solr.cmd
	$solrCommand = """$solrCommand"" start -port $Port -foreground -verbose -Dsolr.log.muteconsole"
	$solrCommand = $solrCommand.Replace('"', '""')
	
	Write-Host "Installing Service"  -ForegroundColor Cyan
	Exec { &$nssmExe install "$ServiceName" cmd.exe "/C $solrCommand < nul"  }


	Write-Host "Updating Service MetaData"  -ForegroundColor Cyan
	Exec { &$nssmExe set $ServiceName DisplayName $DisplayName }
	Exec { &$nssmExe set $ServiceName Description "Solr Search Service for Telligent Community, Running on port $Port" }
	Exec { &$nssmExe set $ServiceName AppDirectory $SolrRoot\server\tmp } # Workaround for https://issues.apache.org/jira/browse/SOLR-9760
	Exec { &$nssmExe set $ServiceName AppStopMethodConsole 120000 }
	Exec { &$nssmExe set $ServiceName AppExit Default Exit }
	Exec { &$nssmExe set $ServiceName AppNoConsole 1 }# Workaround for Windows 10 Creators update - https://git.nssm.cc/?p=nssm.git;a=commit;h=897c7ad10ba9542b650f256445d953eff908b985
	
	$logDir = Join-Path $SolrRoot data\logs
	
	#Recreate nssm log file on each startup
	Exec { &$nssmExe set $ServiceName AppStdoutCreationDisposition 2 }
	Exec { &$nssmExe set $ServiceName AppStderrCreationDisposition 2 }

	#Log to same file
	Exec { &$nssmExe set $ServiceName AppStdout $logDir\nssm.log }
	Exec { &$nssmExe set $ServiceName AppStderr $logDir\nssm.log }

	#Create needed directories
	@('data\logs', 'server\tmp') |% {
		$fullPath = Join-Path $SolrRoot $_
		if(-not(Test-Path $fullPath)) {
			New-Item $fullPath -Type Directory | out-null
		}	
	}

	$ServiceAccount = "NT SERVICE\$ServiceName"
	Write-Host "Configuring service to run as '$ServiceAccount'"  -ForegroundColor Cyan
	Exec { sc.exe config $ServiceName obj= "$ServiceAccount" }

	Write-Host "Granting file system permissions for '$ServiceAccount'"  -ForegroundColor Cyan
	Exec { icacls $SolrRoot /grant "${ServiceAccount}:(OI)(CI)RX" }
	Exec { icacls $SolrRoot\data /grant "${ServiceAccount}:(OI)(CI)M" }
	Exec { icacls $SolrRoot\server\tmp /grant "${ServiceAccount}:(OI)(CI)M" }
}
catch {
	if(Get-Service $ServiceName -ea SilentlyContinue) {
		Write-Warning "Installation failed - rolling back service installation"
		&"$PSScriptRoot\ServiceUninstall.ps1" -ServiceName $ServiceName
	}
	throw
}


Write-Host "Starting $ServiceName"  -ForegroundColor Cyan

try{	
	$errorPrefix = "$ServiceName was installed, but failed to start"
	Exec { &$nssmExe start $ServiceName }

	$solrUrl = "http://localhost:$Port/solr/"
	$errorPrefix = "$ServiceName started, but $solrUrl was not accessible"
	Write-Host "Waiting for Solr to be accessible on $solrUrl"  -ForegroundColor Cyan
	$attempt = 0;
	while($true) {
		try {
			Invoke-WebRequest $solrUrl -UseBasicParsing | Out-Null
			break
		}
		catch {
			$attempts++
			if ($attempts -ge 20) {
				Write-Error $_ -ErrorAction Continue #Force error to log to console despite outer try/catch block
				throw
			}
			Start-Sleep -Seconds 1
		}
	}
	Write-Host "Solr has been successfully installed to $solrUrl" -ForegroundColor Green
}
catch {
	#On error, try and determine which logs to look at based on which ones have been recently written to
	#Where possible, output these directly to the console to ease troubleshooting
	$solrLog = Join-Path $SolrRoot data\logs\solr.log
	$nssmLog = Join-Path $SolrRoot data\logs\nssm.log

	$nssmLogLastModify = (Get-Item $nssmLog -ErrorAction SilentlyContinue).LastWriteTime
	$solrLogLastModify = (Get-Item $solrLog -ErrorAction SilentlyContinue).LastWriteTime
	
	if($solrLogLastModify -and $solrLogLastModify -gt $nssmLogLastModify -and $solrLogLastModify -ge $startAt) {
		$solrLogOutput = Get-Content $solrLog -Tail 50
		
		if ($solrLogOutput) {
			Write-Host 'Last 50 lines of $solrLog' -ForegroundColor Yellow
			$solrLogOutput
		}
				
		Write-Error "$errorPrefix. Review '$solrLog' for more details."
	}
	else {
		$nssmEvents = Get-EventLog -LogName Application -Source nssm -After $startAt -EntryType Error -ErrorAction SilentlyContinue | select TimeGenerated, EntryType, Message
		if ($nssmEvents -and $nssmLogLastModify -ge $startAt) {
			Write-Host "Nssm errors from windows event logs" -ForegroundColor Yellow
			$nssmEvents | Format-List
		}
		else {
			$nssmLogOutput = Get-Content $nssmLog -Tail 50
			if ($nssmLogOutput)
			{
				Write-Host "Last 50 lines of $nssmLog" -ForegroundColor Yellow
				$nssmLogOutput
			}
		}
		
		Write-Error "$errorPrefix. Review the windows event log and '$nssmLog' for more details."
	}
}
