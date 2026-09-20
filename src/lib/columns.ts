/**
 * Maps whatever your source column headers are called onto Faculty-Finder fields.
 * Headers are compared after lowercasing and stripping everything except letters/digits.
 * So "Email Address", "email_address" and "EMAIL-ADDRESS" all resolve to "emailaddress".
 *
 * To support a new column name, just add it to the right list below.
 * Earlier entries win when a source has several candidates for the same field.
 */
export type FieldKey =
  | 'name'
  | 'school'     // the broad faculty/school grouping
  | 'department'
  | 'designation' // academic rank / job title  (maps to AIUB "position")
  | 'type'        // admin role / faculty type   (maps to AIUB "designation")
  | 'email'
  | 'phone'
  | 'room'        // room number — combined with 'building' into office
  | 'building'    // building name
  | 'office'      // single combined office string (wins over room+building)
  | 'profileUrl'
  | 'imageUrl'
  | 'education'
  | 'research'
  | 'academicInterests' // separate from research in AIUB data

export const COLUMN_ALIASES: Record<FieldKey, string[]> = {
  name: ['name', 'fullname', 'facultyname', 'employeename', 'teachername', 'professorname', 'personname'],
  school: ['faculty', 'school', 'collegefaculty', 'facultyname', 'schoolname', 'institute', 'college'],
  department: ['department', 'dept', 'departmentname', 'deptname', 'division', 'unit'],
  // AIUB uses "position" for academic rank; "title", "rank", "designation" are also common
  designation: ['position', 'designation', 'rank', 'jobtitle', 'academicrank', 'title', 'post', 'role'],
  // AIUB uses "designation" for the admin role; most other exports use "type" / "faculty type"
  type: ['facultytype', 'employmenttype', 'stafftype', 'employeetype', 'jobtype', 'type', 'category', 'adminrole', 'designation'],
  email: ['email', 'emailaddress', 'emailid', 'mail'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contactnumber', 'contact', 'cell', 'telephone', 'tel'],
  room: ['roomno', 'room', 'roomnumber'],
  building: ['buildingno', 'building', 'buildingnumber', 'buildingname'],
  office: ['office', 'officeroom', 'officelocation', 'officenumber', 'cabin', 'location'],
  profileUrl: ['profileurl', 'profilelink', 'profile', 'facultyurl', 'homepage', 'website', 'webpage', 'link', 'url', 'page'],
  imageUrl: ['imageurl', 'imagelink', 'photourl', 'photouri', 'photourl', 'photo', 'image', 'picture', 'avatar', 'thumbnail', 'img'],
  education: ['education', 'qualification', 'qualifications', 'academicqualification', 'degrees', 'degree'],
  research: ['researchinterests', 'researchinterest', 'researcharea', 'researchareas', 'research'],
  academicInterests: ['academicinterests', 'academicinterest', 'teachinginterests', 'interests', 'specialization', 'expertise'],
}

export const FIRST_NAME_ALIASES = ['firstname', 'givenname', 'fname']
export const LAST_NAME_ALIASES = ['lastname', 'surname', 'familyname', 'lname']

export function simplifyHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export interface ColumnMap {
  fields: Partial<Record<FieldKey, string>>
  firstName?: string
  lastName?: string
  unknown: string[]
}

export function mapColumns(headers: string[]): ColumnMap {
  const bySimple = new Map<string, string>()
  for (const h of headers) {
    const s = simplifyHeader(h)
    if (s && !bySimple.has(s)) bySimple.set(s, h)
  }
  const used = new Set<string>()
  const fields: Partial<Record<FieldKey, string>> = {}

  const take = (aliases: string[]): string | undefined => {
    for (const a of aliases) {
      const h = bySimple.get(a)
      if (h && !used.has(h)) { used.add(h); return h }
    }
    return undefined
  }

  for (const key of Object.keys(COLUMN_ALIASES) as FieldKey[]) {
    const found = take(COLUMN_ALIASES[key])
    if (found) fields[key] = found
  }
  const firstName = fields.name ? undefined : take(FIRST_NAME_ALIASES)
  const lastName  = fields.name ? undefined : take(LAST_NAME_ALIASES)
  const unknown = headers.filter((h) => h && !used.has(h))
  return { fields, firstName, lastName, unknown }
}
