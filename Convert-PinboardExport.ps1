<#
.SYNOPSIS
    Converts a Pinboard JSON export into the seed format for the new site's
    /.netlify/functions/seed endpoint. Run this once to migrate your existing
    bookmarks in, then use the "+ add" bookmarklet going forward.

.PARAMETER ExportPath
    Path to the Pinboard JSON export file.

.PARAMETER OutputPath
    Where to write the seed JSON. Defaults to .\seed.json

.EXAMPLE
    .\Convert-PinboardExport.ps1 -ExportPath .\pinboard_export.json -OutputPath .\seed.json

    Then import it (replace the placeholders):
    $token = "your-add-token"
    $site  = "https://your-site.netlify.app"
    $body  = Get-Content .\seed.json -Raw
    Invoke-RestMethod -Uri "$site/.netlify/functions/seed" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({ Test-Path $_ -PathType Leaf })]
    [string]$ExportPath,

    [string]$OutputPath = ".\seed.json"
)

$ErrorActionPreference = 'Stop'

$raw = Get-Content -Path $ExportPath -Raw | ConvertFrom-Json
if (-not $raw) { throw "No records found in $ExportPath" }

$bookmarks = foreach ($item in $raw) {

    $tags = @()
    if ($item.tags) {
        $tags = @(($item.tags -split '\s+') | Where-Object { $_ })
    }

    $dateAdded = $null
    if ($item.time) {
        try { $dateAdded = ([datetime]$item.time).ToString('yyyy-MM-dd') } catch { $dateAdded = $null }
    }

    $domain = $null
    if ($item.href) {
        try { $domain = ([uri]$item.href).Host -replace '^www\.', '' } catch { $domain = $null }
    }

    [PSCustomObject]@{
        id     = [guid]::NewGuid().ToString()
        title  = $item.description
        url    = $item.href
        domain = $domain
        notes  = $item.extended
        tags   = $tags
        date   = $dateAdded
    }
}

$bookmarks | ConvertTo-Json -Depth 5 -AsArray | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Wrote $($bookmarks.Count) bookmarks to $OutputPath"
Write-Host "Next: POST this file's contents to <your-site>/.netlify/functions/seed with your ADD_TOKEN as a Bearer token."
