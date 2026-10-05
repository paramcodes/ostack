#!/usr/bin/env node
// Prints the unix-seconds timestamp of the most recent opencode session whose
// working directory is the given path or a path beneath it. Prints 0 when there
// is no session, and when the session store is unreadable.
//
// This replaces Cursor's per-project agent-transcripts directory, which does not
// exist on this harness. opencode keeps sessions in a SQLite store keyed by
// directory, so a worktree's last chat is a query rather than a file scan.

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const dir = process.argv[2]
if (!dir) {
	console.error("usage: session-last-touch.mjs <directory>")
	process.exit(2)
}

const dbPath = join(homedir(), ".local", "share", "opencode", "opencode.db")
if (!existsSync(dbPath)) {
	console.log(0)
	process.exit(0)
}

let DatabaseSync
try {
	;({ DatabaseSync } = await import("node:sqlite"))
} catch {
	console.log(0)
	process.exit(0)
}

let db
try {
	db = new DatabaseSync(dbPath, { readOnly: true })
	const row = db
		.prepare(
			`select max(time_updated) as last from session
			 where directory = ? or directory like ? escape '\\'`,
		)
		.get(dir, `${dir.replace(/[\\%_]/g, "\\$&")}/%`)
	const ms = row?.last ?? 0
	console.log(ms > 0 ? Math.floor(ms / 1000) : 0)
} catch {
	console.log(0)
} finally {
	db?.close()
}