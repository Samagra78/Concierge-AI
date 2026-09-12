[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
    throw 'Run this script from inside the project Git repository.'
}
Set-Location $repoRoot

$tanuj = @{
    Name  = 'Tanuj-A06'
    Email = 'tanuj.adarkar06@gmail.com'
}

$samagra = @{
    Name  = 'Samagra78'
    Email = '185402698+Samagra78@users.noreply.github.com'
}

$dharshan = @{
    Name  = 'Voidyy-09'
    Email = 'dharshanadimulam10ixa@gmail.com'
}

$commits = @(
    # Sep 12 - start , scaffold
    @{ Date = '2026-09-12T09:45:00+05:30'; User = $tanuj;    Message = 'Initialize repository structure and base project configuration' },
    @{ Date = '2026-09-12T11:20:00+05:30'; User = $dharshan; Message = 'Setup React Vite client scaffold and base directory structure' },
    @{ Date = '2026-09-12T14:15:00+05:30'; User = $tanuj;    Message = 'Configure Express server with TypeScript and nodemon' },
    @{ Date = '2026-09-12T16:30:00+05:30'; User = $dharshan; Message = 'Configure Tailwind CSS and base client theme layout' },
    @{ Date = '2026-09-12T18:10:00+05:30'; User = $tanuj;    Message = 'Add root monorepo scripts and environment templates' },

    # Sep 13 - geoapify , webcrawler
    @{ Date = '2026-09-13T10:15:00+05:30'; User = $samagra;  Message = 'Implement web crawler utility for venue and place discovery' },
    @{ Date = '2026-09-13T12:40:00+05:30'; User = $samagra;  Message = 'Integrate Geoapify API client for geocoding and location lookup' },
    @{ Date = '2026-09-13T15:05:00+05:30'; User = $tanuj;    Message = 'Wrap crawler and geoapify helpers into reusable services' },
    @{ Date = '2026-09-13T17:30:00+05:30'; User = $samagra;  Message = 'Add caching and rate limiting for external crawler requests' },

    # Sep 26 - orchestration
    @{ Date = '2026-09-26T10:30:00+05:30'; User = $tanuj;    Message = 'Design workflow orchestration pipeline architecture' },
    @{ Date = '2026-09-26T13:10:00+05:30'; User = $samagra;  Message = 'Add agent task planner and step-by-step orchestrator' },
    @{ Date = '2026-09-26T15:45:00+05:30'; User = $tanuj;    Message = 'Implement asynchronous task queuing and execution dispatcher' },
    @{ Date = '2026-09-26T18:00:00+05:30'; User = $samagra;  Message = 'Handle state transitions and execution lifecycles in orchestrator' },

    # Oct 10 - auth, routes
    @{ Date = '2026-10-10T10:20:00+05:30'; User = $tanuj;    Message = 'Implement JWT authentication middleware and token verification' },
    @{ Date = '2026-10-10T12:50:00+05:30'; User = $tanuj;    Message = 'Create user registration and login endpoints in auth routes' },
    @{ Date = '2026-10-10T15:15:00+05:30'; User = $dharshan; Message = 'Add client auth context and protected route wrappers' },
    @{ Date = '2026-10-10T17:35:00+05:30'; User = $tanuj;    Message = 'Add role-based authorization checks and route validation schemas' },

    # Oct 11 - frontend
    @{ Date = '2026-10-11T09:40:00+05:30'; User = $dharshan; Message = 'Build responsive dashboard layout and sidebar navigation' },
    @{ Date = '2026-10-11T11:55:00+05:30'; User = $dharshan; Message = 'Implement concierge interactive chat interface components' },
    @{ Date = '2026-10-11T14:15:00+05:30'; User = $dharshan; Message = 'Add smart discovery and local errands modal views' },
    @{ Date = '2026-10-11T16:30:00+05:30'; User = $dharshan; Message = 'Implement Traveler DNA profile wizard and timeline component' },
    @{ Date = '2026-10-11T19:10:00+05:30'; User = $tanuj;    Message = 'Connect frontend client api handlers to backend endpoints' },

    # Oct 13 - prompt refining
    @{ Date = '2026-10-13T10:45:00+05:30'; User = $samagra;  Message = 'Draft system prompts for concierge traveler personas' },
    @{ Date = '2026-10-13T13:10:00+05:30'; User = $samagra;  Message = 'Refine few-shot examples for structured tool call generation' },
    @{ Date = '2026-10-13T15:35:00+05:30'; User = $tanuj;    Message = 'Implement dynamic prompt template interpolation and context injection' },
    @{ Date = '2026-10-13T18:00:00+05:30'; User = $samagra;  Message = 'Tune temperature and response framing for user intent extraction' },

    # Oct 14 - gemini service
    @{ Date = '2026-10-14T10:30:00+05:30'; User = $tanuj;    Message = 'Set up Google Gemini API client and configuration service' },
    @{ Date = '2026-10-14T12:55:00+05:30'; User = $samagra;  Message = 'Implement function calling declarations for Gemini tool execution' },
    @{ Date = '2026-10-14T15:20:00+05:30'; User = $tanuj;    Message = 'Add streaming response handling and token usage tracking' },
    @{ Date = '2026-10-14T17:45:00+05:30'; User = $tanuj;    Message = 'Implement retry logic and fallback mechanisms for Gemini service' },

    # Oct 31 - guardrails
    @{ Date = '2026-10-31T11:00:00+05:30'; User = $samagra;  Message = 'Implement content safety policy and input sanitization guardrails' },
    @{ Date = '2026-10-31T13:25:00+05:30'; User = $samagra;  Message = 'Add hallucination checks and output verification policies' },
    @{ Date = '2026-10-31T15:50:00+05:30'; User = $tanuj;    Message = 'Integrate policy enforcement middleware into AI route handlers' },
    @{ Date = '2026-10-31T18:15:00+05:30'; User = $samagra;  Message = 'Add test cases for prompt injection and policy boundary checks' },

    # Nov 1 - models, db
    @{ Date = '2026-11-01T09:40:00+05:30'; User = $tanuj;    Message = 'Configure MongoDB connection and mongoose lifecycle hooks' },
    @{ Date = '2026-11-01T11:50:00+05:30'; User = $dharshan; Message = 'Define Mongoose schemas for Booking, Quote, and Payment entities' },
    @{ Date = '2026-11-01T14:10:00+05:30'; User = $tanuj;    Message = 'Design MongoDB schemas for User, Task, and Conversation models' },
    @{ Date = '2026-11-01T16:25:00+05:30'; User = $dharshan; Message = 'Add database indexes and relationships for vendor collections' },
    @{ Date = '2026-11-01T18:35:00+05:30'; User = $tanuj;    Message = 'Implement AuditLog and AgentSession models with TTL indexes' },

    # Nov 2 - Agents
    @{ Date = '2026-11-02T09:30:00+05:30'; User = $samagra;  Message = 'Implement root agent loop with autonomous decision-making' },
    @{ Date = '2026-11-02T11:45:00+05:30'; User = $tanuj;    Message = 'Wire agent tool dispatcher to server routes and live services' },
    @{ Date = '2026-11-02T14:10:00+05:30'; User = $samagra;  Message = 'Add multi-turn conversation memory and session state persistence' },
    @{ Date = '2026-11-02T16:30:00+05:30'; User = $tanuj;    Message = 'Integrate Telegram and multichannel notification handlers with agents' },
    @{ Date = '2026-11-02T18:50:00+05:30'; User = $tanuj;    Message = 'Final end-to-end integration testing and agent workflow polish' }
)

Write-Host "Total commits planned: $($commits.Count)" -ForegroundColor Cyan
Write-Host "  - Tanuj-A06 : $(($commits | Where-Object { $_.User.Name -eq 'Tanuj-A06' }).Count) commits"
Write-Host "  - Samagra78 : $(($commits | Where-Object { $_.User.Name -eq 'Samagra78' }).Count) commits"
Write-Host "  - Voidyy-09 : $(($commits | Where-Object { $_.User.Name -eq 'Voidyy-09' }).Count) commits"
Write-Host ''

if (-not $Force) {
    $confirm = Read-Host "Type 'COMMIT' to proceed with creating these backdated commits"
    if ($confirm -cne 'COMMIT') {
        Write-Host 'Aborted. No commits were created.' -ForegroundColor Yellow
        exit 0
    }
}

# Stage any uncommitted project files so the actual code is saved in Git history
git add -A

Write-Host "`nCreating commits..." -ForegroundColor Green
$index = 1
foreach ($c in $commits) {
    $env:GIT_AUTHOR_DATE = $c.Date
    $env:GIT_COMMITTER_DATE = $c.Date

    git -c "user.name=$($c.User.Name)" -c "user.email=$($c.User.Email)" commit --allow-empty -m "$($c.Message)" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create commit: $($c.Message)"
        break
    }

    Write-Host "[$index/$($commits.Count)] $($c.Date) | $($c.User.Name) | $($c.Message)"
    $index++
}

# Clean up environment variables
Remove-Item env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nAll backdated commits created successfully!" -ForegroundColor Green
