import { exec } from '~/server/utils/await_callback'
import  { AsyncMemCache } from '~/server/utils/cache'

const VALID_DURATION = 1000 * 60 * 60 // 1 hour
const LTS_PREFIX = [
    'v4.0',
    'v5.0', 'v5.1', 'v5.2', 'v5.3', 'v5.4',
    'v6.1', 'v6.5',
    'v7.1', 'v7.5',
    'v8.1', 'v8.5',
]

const versionsCache = new AsyncMemCache(VALID_DURATION, async () => {
    return new TiupVersions(await exec('tiup list tidb'))
})

export default defineEventHandler(async (event) => {
    const versions = await versionsCache.getValue()

    return {
        versions: versions.getLatestLTSVersions().reverse(),
    }
})

interface TiupVersionPublic {
    Version: string
    Release: Date
    Platforms: string[]
}

interface TiupVersion {
    Version: string
    Installed: boolean
    Release: Date
    Platforms: string[]
}

class TiupVersions {
    private versions: TiupVersion[] = []
    private LTSVersions: TiupVersion[] = []
    private latestLTSVersions: TiupVersion[] = []

    private nightlyVersionTag: string = ''

    constructor(tiup_list_tiup: string) {
        this.parseVersions(tiup_list_tiup)
        this.filterLTSVersions()
    }

    private parseVersions(versions: string) {
        const lines = versions.split('\n').filter(line => line.trim() !== '')
        for (const line of lines) {
            const installedMatch = line.match(/^(v\d+\.\d+\.\d+.*?)\s+(YES)\s+(.*?)\s+(.*)/)
            if (installedMatch) {
                const version: TiupVersion = {
                    Version: installedMatch[1].trim(),
                    Installed: installedMatch[2] === 'YES',
                    Release: new Date(installedMatch[3].trim()),
                    Platforms: installedMatch[4].trim().split(',').map(p => p.trim())
                }
                this.versions.push(version)
                continue
            }
            const uninstalledMatch = line.match(/^(v\d+\.\d+\.\d+.*?)\s+(.*?)\s+(.*)/)
            if (uninstalledMatch) {
                const version: TiupVersion = {
                    Version: uninstalledMatch[1].trim(),
                    Installed: false,
                    Release: new Date(uninstalledMatch[2].trim()),
                    Platforms: uninstalledMatch[3].trim().split(',').map(p => p.trim())
                }
                this.versions.push(version)
                continue
            }
            const nightlyMatch = line.match(/^nightly\s->\s(v\d+\.\d+\.\d.*?)\s+(.*?)\s+(.*)/)
            if (nightlyMatch) {
                this.nightlyVersionTag = nightlyMatch[1].trim()
                continue
            }
        }
        this.versions.sort((a, b) => b.Release.getTime() - a.Release.getTime())
    }

    private filterLTSVersions() {
        this.LTSVersions = this.versions.filter(v => LTS_PREFIX.some(prefix => v.Version.startsWith(prefix)))
        for (const ltsPrefix of LTS_PREFIX) {
            let latestPatchVersion = 0
            let latestVersion = null;
            for (const version of this.LTSVersions) {
                if (version.Version.startsWith(ltsPrefix + '.')) {
                    const patchVersion = parseInt(version.Version.slice(ltsPrefix.length + 1))
                    if (patchVersion > latestPatchVersion) {
                        latestPatchVersion = patchVersion
                        latestVersion = version
                    }
                }
            }
            if (latestVersion && latestPatchVersion > 0) {
                this.latestLTSVersions.push(latestVersion)
            }
        }
    }

    private asPublicVersion(versions: TiupVersion[]): TiupVersionPublic[] {
        return versions.map(v => ({
            Version: v.Version,
            Release: v.Release,
            Platforms: v.Platforms,
        }))
    }

    getAllVersions(): TiupVersionPublic[] {
        return this.asPublicVersion(this.versions)
    }

    getLTSVersions(): TiupVersionPublic[] {
        return this.asPublicVersion(this.LTSVersions)
    }

    getLatestLTSVersions(): TiupVersionPublic[] {
        return this.asPublicVersion(this.latestLTSVersions)
    }
}
