param(
    [string]$JobRoot = $PSScriptRoot
)
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
	throw 'You must be running as an administrator to perform a health check on the Telligent Job Server'
}
if(-not (Join-Path $JobRoot Telligent.Jobs.Server.exe | Test-Path)) {
	throw "'$JobRoot' does not contain 'Telligent.Jobs.Server.exe'"
}

$results = [ordered]@{}
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Telligent Community Job Server Health Check    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host

function HealthCheck 
{
    param(
        [string]$Name,
        [ScriptBlock]$Test,
        [string[]]$DependsOn
    )
    if($DependsOn) {
        $missingDependencies = $DependsOn | ? { $_ -notin $results.Keys -or $results[$_] -ne 'Pass' }
        if ($missingDependencies) {
            $results.Add($Name, 'Skipped')
            return
        }
    }

    Write-Host "Checking $Name... " -ForegroundColor Cyan

    $result = try {
        & $Test 
    }
    catch {
        Write-Host "ERROR: $_" -ForegroundColor Red -BackgroundColor Black
    }
    if($result) {
        $results.Add($Name, 'Pass')
    }
    else {
        $results.Add($Name, 'Fail')
    }
}


function Get-ConnectionString 
{
    param(
        [string]$ConnectionStringName
    )

    $connectionStrings = [xml](Get-Content (Join-Path $JobRoot connectionStrings.Config))
    $result = $connectionStrings.connectionStrings.add |
        ? { $_.name -eq $ConnectionStringName} |
        select -ExpandProperty ConnectionString

    if ($result) { $result } else { throw "Connection String '$ConnectionStringName' is not defiend in connectionStrings.config" }
}

function Test-Acls {
    param(
        [string]$Path,
        [System.Security.AccessControl.FileSystemRights]$RequiedRights
    )
    $userName = $service.StartName

    # If a username has multiple aliases, need to translate to the primary name
    # e.g. 'NT AUTHORITY\NETWORK SERVICE' and 'NT AUTHORITY\NETWORKSERVICE'
    $userName = (New-Object System.Security.Principal.NTAccount("$userName")).Translate([System.Security.Principal.SecurityIdentifier]).Translate([System.Security.Principal.NTAccount]).Value

    $accessRights = Get-Acl $Path |
        select -ExpandProperty Access

    $userAccess = $accessRights | ? { $_.IdentityReference.Value -eq $userName }

    #Report permissions that are not needed for review
    $expectedUsers = @($userName, 'NT AUTHORITY\System', 'BUILTIN\Administrators')
    $usersWithAllowRights = $accessRights |
        ? AccessControlType -eq Allow |
        select -ExpandProperty IdentityReference |
        select -ExpandProperty Value -Unique
    
    $usersWithAllowRights |
        ? { $_ -notin $expectedUsers } |
        % { Write-Warning "Review whether '$_' needs permissions on '$Path'" }

    #Check no deny permissions
    $denyAcls = $userAccess |? AccessControlType -eq Deny
    if ($denyAcls) {
        throw "'$userName' has deny ACLs on '$Path'"
    }

    #Check for allows
    $allowAcls = $userAccess |
        ? AccessControlType -eq Allow |
        ? { (($_.FileSystemRights -band $RequiedRights) -eq $RequiedRights) }

    if (-not $allowAcls) {
        throw "'$userName' has not been granted '$RequiedRights' on '$Path'.  This may be a false positive if this user is a member of a group that does have permissions"
    }

    $true
}

HealthCheck 'System Information' -Test{
    $platformVersion = Get-Item Telligent.Evolution.Platform.dll |
            Select -ExpandProperty VersionInfo -First 1 |
            Select -ExpandProperty FileVersion -ErrorAction SilentlyContinue

    Write-Host "Platform Version: $platformVersion"
    Write-Host "Path:             $JobRoot"
    Write-Host "Machine Name:     $([Environment]::MachineName)"
    Write-Host "Username:         $([Environment]::UserName)"
    Write-Host "UserDomain:       $([Environment]::UserDomainName)"

    $true
}

HealthCheck 'Blocked Files' -Test {
    $blockedFile = get-childitem $JobRoot -Recurse |
        Get-Item -Stream 'Zone.Identifier' -ErrorAction SilentlyContinue |
        select -First 1

    if($blockedFile) {
        throw "Directory contains blocked files. Use the Unblock-File command to correct this"
    }
    else {
        $true
    }
}

HealthCheck 'Log Directory Exists' -Test {
    if(-not (Join-Path $JobRoot Logs | Test-Path)) {
        throw "'Logs' directory does not exist"
    } else {
        $true
    }
}

HealthCheck 'Search Configuration (Content)' {
    $url = Get-ConnectionString SearchContentUrl
    Write-Host 'Search Url:' $url

    $url = $url.TrimEnd('/') + "/select?q=*:*"

    Invoke-RestMethod $url
}

HealthCheck 'Search Configuration (Conversations)' {
    $url = Get-ConnectionString SearchConversationsUrl
    Write-Host 'Search Url:' $url

    $url = $url.TrimEnd('/') + "/select?q=*:*"

    Invoke-RestMethod $url
}

HealthCheck 'Filestorage Configuration' {
    $path = Get-ConnectionString FileStorage
    Write-Host 'Filestorage Path: ' $path

    if ($path.StartsWith('~')) {
        Write-Warning 'Relative filestorage paths may not work in the job server'
        $path = Join-Path $JobRoot $path.TrimStart('~').Replace('/', '\').TrimStart('\')
    }
    if (-not (Test-Path $path)) {
        throw "'$path' does not exist"
    }
    else {
        $true
    }
}

HealthCheck 'Service Installed' {
    $exe = Join-Path $JobRoot Telligent.Jobs.Server.exe | Resolve-Path

    $service = Get-WmiObject win32_service |
        ? { $_.PathName } |
        ? {
            $servicePath = Resolve-Path $_.PathName.Trim('"') -ErrorAction SilentlyContinue
            return $servicePath -and $servicePath.Path.Trim() -eq $exe
        }

    if ($service) {
        $script:service = $service
        Write-Host "Installed as '$($service.Name)' Service"
        Write-Host "Service running as '$($service.StartName)'"
        $service
    } else {
        throw "Job Server is not installed as a service. Run ServiceInstall.ps1 to correct this"
    }
}

HealthCheck 'Service Running' -DependsOn 'Service Installed' {
    if($service.State -ne 'Running') {
        throw "Service '$($service.Name)' is not running"
    }
    else {
        $true
    }
} 

HealthCheck 'Service Auto Start' -DependsOn 'Service Installed' {
    if($service.StartMode -ne 'Auto') {
        throw "Service '$($service.Name)' is not set to automatically start"
    }
    else {
        $true
    }
} 

HealthCheck 'Root Permissions' -DependsOn 'Service Installed' {
    $userName = $service.StartName

    Test-Acls $JobRoot 'ReadAndExecute'
} 

HealthCheck 'Log Permissions' -DependsOn 'Service Installed','Log Directory Exists' {
    $path = Join-Path $JobRoot Logs
    Test-Acls $path 'Modify'
} 

HealthCheck 'Filestorage Permissions' -DependsOn 'Service Installed','Filestorage Configuration' {
    $path = Get-ConnectionString FileStorage
    Test-Acls $path 'Modify'
} 



Write-Host
Write-Host "Healthcheck Summary" -ForegroundColor Cyan
$results.GetEnumerator() |% {
    $colour = switch ($_.Value) 
    {
        'Pass' { 'Green' }
        'Skipped' { 'Yellow' }
        'Fail' { 'Red' }
    }

    Write-Host '   ' "$($_.Value): ".PadRight(9) -ForegroundColor $colour -NoNewline
    Write-Host $_.Key
}
Write-Host
