import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json')
const TALENT_POOL_FILE = path.join(DATA_DIR, 'talent-pool.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJson(file, fallback) {
  ensureDataDir()
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2))
    return structuredClone(fallback)
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function writeJson(file, data) {
  ensureDataDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function getUsers() {
  return readJson(USERS_FILE, [])
}

export function saveUsers(users) {
  writeJson(USERS_FILE, users)
}

export function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id) {
  return getUsers().find((u) => u.id === id)
}

export function findUserByVerificationToken(token) {
  return getUsers().find((u) => u.verificationToken === token)
}

export function createUser(user) {
  const users = getUsers()
  users.push(user)
  saveUsers(users)
  return user
}

export function updateUser(id, updates) {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return null
  users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() }
  saveUsers(users)
  return users[index]
}

export function getApplicationsByUserId(userId) {
  const all = readJson(APPLICATIONS_FILE, [])
  return all.filter((a) => a.userId === userId)
}

export function createApplication(application) {
  const all = readJson(APPLICATIONS_FILE, [])
  all.push(application)
  writeJson(APPLICATIONS_FILE, all)
  return application
}

export function getTalentPoolSubmissions() {
  return readJson(TALENT_POOL_FILE, [])
}

export function findTalentPoolByEmail(email) {
  return getTalentPoolSubmissions().find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase(),
  )
}

export function createTalentPoolSubmission(entry) {
  const all = getTalentPoolSubmissions()
  all.push(entry)
  writeJson(TALENT_POOL_FILE, all)
  return entry
}
