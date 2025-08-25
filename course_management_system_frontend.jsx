import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Separator,
} from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LogOut,
  Mail,
  MessageSquare,
  NotebookPen,
  Plus,
  Settings,
  Upload,
  Users,
} from "lucide-react";

/**
 * Course Management System (CMS) – Single-file React App
 * ------------------------------------------------------
 * - Tech: React + Tailwind + shadcn/ui + lucide-react
 * - Storage: localStorage (mock DB) – replace with your API later
 * - Roles: student, faculty, admin
 * - Features covered:
 *   • Auth (mock) & role switching
 *   • Course creation & enrollment
 *   • Assignments: create, submit, grade, feedback
 *   • Grade publishing & transcript view
 *   • Announcements & notifications
 *   • Timetable & academic calendar (simple weekly grid + events)
 *   • Messaging (course-scoped threads)
 *   • Admin: manage users, roles, courses
 *
 * Notes:
 * - This file is intentionally self-contained for quick preview. In production,
 *   split into modules and wire to a backend (e.g., REST/GraphQL).
 */

// ---------------------------- Utility & Mock DB ----------------------------
const LS_KEY = "cms_mock_db_v1";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}

function loadDB() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);
  // seed with some demo data
  const demoUsers = [
    { id: uid("u"), name: "Alice Ahmed", email: "alice@uni.edu", role: "student", password: "pass" },
    { id: uid("u"), name: "Dr. Barun", email: "barun@uni.edu", role: "faculty", password: "pass" },
    { id: uid("u"), name: "Carol Admin", email: "carol@uni.edu", role: "admin", password: "pass" },
  ];
  const c1 = { id: uid("c"), code: "CSE101", title: "Intro to Programming", facultyId: demoUsers[1].id, capacity: 60, credits: 3 };
  const c2 = { id: uid("c"), code: "MAT110", title: "Calculus I", facultyId: demoUsers[1].id, capacity: 80, credits: 4 };
  const courses = [c1, c2];
  const enrollments = [{ id: uid("enr"), courseId: c1.id, userId: demoUsers[0].id }];
  const assignments = [
    { id: uid("a"), courseId: c1.id, title: "HW1: Variables & Loops", dueAt: isoPlusDays(7), points: 100, instructions: "Solve the attached problems." },
  ];
  const submissions = [];
  const grades = [];
  const announcements = [
    { id: uid("ann"), courseId: c1.id, title: "Welcome!", body: "First lecture slides posted.", createdAt: new Date().toISOString() },
  ];
  const messages = [];
  const calendarEvents = [
    { id: uid("ev"), title: "Semester Starts", date: todayISO(), type: "academic" },
    { id: uid("ev"), title: "Add/Drop Deadline", date: isoPlusDays(10), type: "deadline" },
  ];
  const timetable = [
    { id: uid("tt"), courseId: c1.id, day: 0, start: "09:00", end: "10:20", room: "A-201" }, // Mon
    { id: uid("tt"), courseId: c1.id, day: 2, start: "09:00", end: "10:20", room: "A-201" }, // Wed
    { id: uid("tt"), courseId: c2.id, day: 1, start: "11:00", end: "12:20", room: "B-105" }, // Tue
  ];
  const db = { users: demoUsers, courses, enrollments, assignments, submissions, grades, announcements, messages, calendarEvents, timetable };
  localStorage.setItem(LS_KEY, JSON.stringify(db));
  return db;
}

function saveDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoPlusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// ---------------------------- UI building blocks ----------------------------
function AppShell({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6" />
            <span className="font-semibold text-lg">CMS</span>
            <Badge variant="secondary" className="ml-2">Course Management System</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" /> Quick Actions
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Quick Actions</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  <Button variant="secondary" className="w-full">New Message</Button>
                  <Button variant="secondary" className="w-full">Create Course</Button>
                  <Button variant="secondary" className="w-full">Post Announcement</Button>
                </div>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{initials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      <footer className="border-t bg-white/60 mt-12">
        <div className="mx-auto max-w-7xl p-4 text-sm text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} CMS Demo</span>
          <span>Built with React, Tailwind, shadcn/ui</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, description, right, children }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {right}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function initials(name = "?") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------- Auth (Mock) ----------------------------
function AuthGate({ onLogin }) {
  const [db, setDb] = useState(loadDB());
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  useEffect(() => saveDB(db), [db]);

  const handleLogin = () => {
    const user = db.users.find((u) => u.email === form.email && u.password === form.password);
    if (!user) return setError("Invalid credentials");
    onLogin(user);
  };
  const handleRegister = () => {
    if (!form.email || !form.password || !form.name) return setError("Fill all fields");
    if (db.users.some((u) => u.email === form.email)) return setError("Email already in use");
    const newUser = { id: uid("u"), name: form.name, email: form.email, password: form.password, role: form.role };
    const next = { ...db, users: [...db.users, newUser] };
    setDb(next);
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to CMS</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "register" && (
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {mode === "register" && (
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "login" ? (
              <>
                <Button className="flex-1" onClick={handleLogin}>Sign In</Button>
                <Button variant="outline" onClick={() => setMode("register")}>Create account</Button>
              </>
            ) : (
              <>
                <Button className="flex-1" onClick={handleRegister}>Register</Button>
                <Button variant="outline" onClick={() => setMode("login")}>Back to login</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------- Dashboard ----------------------------
function Dashboard({ user, onLogout }) {
  const [db, setDb] = useState(loadDB());
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState("");

  useEffect(() => saveDB(db), [db]);

  const myEnrollments = useMemo(() => db.enrollments.filter((e) => e.userId === user.id), [db, user.id]);
  const myCourses = useMemo(() => {
    if (user.role === "student") {
      const courseIds = new Set(myEnrollments.map((e) => e.courseId));
      return db.courses.filter((c) => courseIds.has(c.id));
    }
    if (user.role === "faculty") {
      return db.courses.filter((c) => c.facultyId === user.id);
    }
    return db.courses; // admin sees all
  }, [db.courses, myEnrollments, user]);

  const visibleCourses = useMemo(() => myCourses.filter((c) => [c.code, c.title].join(" ").toLowerCase().includes(filter.toLowerCase())), [myCourses, filter]);

  const addCourse = (course) => setDb((d) => ({ ...d, courses: [...d.courses, course] }));
  const enroll = (courseId, userId) => setDb((d) => ({ ...d, enrollments: [...d.enrollments, { id: uid("enr"), courseId, userId }] }));
  const drop = (courseId, userId) => setDb((d) => ({ ...d, enrollments: d.enrollments.filter((e) => !(e.courseId === courseId && e.userId === userId)) }));

  const isEnrolled = (courseId) => db.enrollments.some((e) => e.courseId === courseId && e.userId === user.id);

  return (
    <AppShell user={user} onLogout={onLogout}>
      <div className="grid gap-6">
        <Hero user={user} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            {user.role === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <Overview user={user} db={db} />
          </TabsContent>

          <TabsContent value="courses">
            <Section
              title="Courses"
              description="Search, create, enroll, and manage courses"
              right={
                <div className="flex items-center gap-2">
                  <Input placeholder="Search by code/title" className="w-56" value={filter} onChange={(e) => setFilter(e.target.value)} />
                  {(user.role === "faculty" || user.role === "admin") && (
                    <CreateCourse onCreate={(course) => addCourse(course)} currentUser={user} />
                  )}
                </div>
              }
            >
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    faculty={db.users.find((u) => u.id === course.facultyId)}
                    enrolled={isEnrolled(course.id)}
                    canEnroll={user.role === "student"}
                    onEnroll={() => enroll(course.id, user.id)}
                    onDrop={() => drop(course.id, user.id)}
                    db={db}
                    setDb={setDb}
                    user={user}
                  />
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab user={user} db={db} setDb={setDb} />
          </TabsContent>

          <TabsContent value="grades">
            <GradesTab user={user} db={db} setDb={setDb} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarTab user={user} db={db} setDb={setDb} />
          </TabsContent>

          <TabsContent value="messages">
            <MessagingTab user={user} db={db} setDb={setDb} />
          </TabsContent>

          {user.role === "admin" && (
            <TabsContent value="admin">
              <AdminTab user={user} db={db} setDb={setDb} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}

function Hero({ user }) {
  return (
    <div className="rounded-2xl p-6 bg-white shadow-sm grid md:grid-cols-2 gap-4 items-center">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hi {user.name.split(" ")[0]}, welcome back 👋</h1>
        <p className="text-slate-600 mt-1">Role: <Badge variant="outline" className="align-middle">{user.role}</Badge></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="gap-1"><BookOpen className="h-4 w-4" /> Courses</Badge>
          <Badge className="gap-1" variant="secondary"><NotebookPen className="h-4 w-4" /> Assignments</Badge>
          <Badge className="gap-1" variant="secondary"><Calendar className="h-4 w-4" /> Calendar</Badge>
          <Badge className="gap-1" variant="secondary"><MessageSquare className="h-4 w-4" /> Messages</Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active Courses" value={user.role === "student" ? "My" : user.role === "faculty" ? "Teaching" : "Total"} icon={<BookOpen className="h-4 w-4" />} />
        <Stat label="Assignments" value="Due Soon" icon={<NotebookPen className="h-4 w-4" />} />
        <Stat label="Notifications" value="New" icon={<Bell className="h-4 w-4" />} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold flex items-center gap-2 mt-1">{icon} {value}</div>
    </div>
  );
}

// ---------------------------- Courses ----------------------------
function CreateCourse({ onCreate, currentUser }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", capacity: 60, credits: 3 });

  const handleCreate = () => {
    if (!form.code || !form.title) return;
    const course = { id: uid("c"), ...form, facultyId: currentUser.id };
    onCreate(course);
    setOpen(false);
    setForm({ code: "", title: "", capacity: 60, credits: 3 });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Course</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., CSE201" />
          </div>
          <div className="grid gap-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Data Structures" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="grid gap-1">
              <Label>Credits</Label>
              <Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
            </div>
          </div>
          <div className="pt-2"><Button onClick={handleCreate}>Create</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({ course, faculty, enrolled, canEnroll, onEnroll, onDrop, db, setDb, user }) {
  const myEnrollmentCount = db.enrollments.filter((e) => e.courseId === course.id).length;
  const remaining = course.capacity - myEnrollmentCount;

  const postAnnouncement = (title, body) => {
    const ann = { id: uid("ann"), courseId: course.id, title, body, createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, announcements: [ann, ...d.announcements] }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{course.code} — {course.title}</span>
          <Badge variant={remaining > 0 ? "secondary" : "destructive"}>{remaining > 0 ? `${remaining} seats left` : "Full"}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Faculty: {faculty?.name}</span>
          <span className="text-slate-500">Credits: {course.credits}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {canEnroll && !enrolled && remaining > 0 && <Button onClick={onEnroll}>Enroll</Button>}
          {canEnroll && enrolled && <Button variant="outline" onClick={onDrop}>Drop</Button>}
          {(user.role === "faculty" || user.role === "admin") && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Post Announcement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                <AnnouncementForm onSubmit={postAnnouncement} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-sm font-medium">Announcements</div>
          <div className="space-y-2 max-h-40 overflow-auto pr-1">
            {db.announcements.filter((a) => a.courseId === course.id).map((a) => (
              <div key={a.id} className="rounded-lg border p-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{a.title}</span>
                  <span className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600">{a.body}</p>
              </div>
            ))}
            {db.announcements.filter((a) => a.courseId === course.id).length === 0 && (
              <p className="text-sm text-slate-500">No announcements yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementForm({ onSubmit }) {
  const [form, setForm] = useState({ title: "", body: "" });
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid gap-1">
        <Label>Body</Label>
        <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      </div>
      <div className="pt-2">
        <Button onClick={() => onSubmit(form.title, form.body)} disabled={!form.title || !form.body}>Post</Button>
      </div>
    </div>
  );
}

// ---------------------------- Assignments ----------------------------
function AssignmentsTab({ user, db, setDb }) {
  const myCourseIds = useMemo(() => {
    if (user.role === "student") return new Set(db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId));
    if (user.role === "faculty") return new Set(db.courses.filter((c) => c.facultyId === user.id).map((c) => c.id));
    return new Set(db.courses.map((c) => c.id));
  }, [db, user]);

  const visibleAssignments = db.assignments.filter((a) => myCourseIds.has(a.courseId));

  const createAssignment = (courseId, data) => {
    const a = { id: uid("a"), courseId, ...data };
    setDb((d) => ({ ...d, assignments: [a, ...d.assignments] }));
  };

  const submitWork = (assignmentId, userId, fileName, note) => {
    const sub = { id: uid("sub"), assignmentId, userId, fileName, note, submittedAt: new Date().toISOString() };
    setDb((d) => ({ ...d, submissions: [sub, ...d.submissions] }));
  };

  const gradeSubmission = (submissionId, score, feedback) => {
    const g = { id: uid("g"), submissionId, score, feedback, gradedAt: new Date().toISOString() };
    setDb((d) => ({ ...d, grades: [g, ...d.grades] }));
  };

  return (
    <div className="grid gap-6">
      {(user.role === "faculty" || user.role === "admin") && (
        <Section title="Create Assignment" description="Attach details and set a due date">
          <CreateAssignmentForm courses={[...myCourseIds].map((id) => db.courses.find((c) => c.id === id))} onCreate={createAssignment} />
        </Section>
      )}

      <Section title="Assignments" description="View assignments by course">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleAssignments.map((a) => {
                const course = db.courses.find((c) => c.id === a.courseId);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{course?.code}</TableCell>
                    <TableCell>{a.title}</TableCell>
                    <TableCell>{new Date(a.dueAt).toLocaleString()}</TableCell>
                    <TableCell>{a.points}</TableCell>
                    <TableCell>
                      {user.role === "student" ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="secondary" className="gap-2"><Upload className="h-4 w-4" /> Submit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Submit Work</DialogTitle></DialogHeader>
                            <SubmitForm onSubmit={(fileName, note) => submitWork(a.id, user.id, fileName, note)} />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="secondary">View Submissions</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Submissions — {a.title}</DialogTitle></DialogHeader>
                            <SubmissionsList assignment={a} db={db} onGrade={gradeSubmission} />
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {visibleAssignments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No assignments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

function CreateAssignmentForm({ courses, onCreate }) {
  const [form, setForm] = useState({ courseId: courses[0]?.id ?? "", title: "", dueAt: isoPlusDays(7), points: 100, instructions: "" });
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="grid gap-1">
        <Label>Course</Label>
        <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid gap-1">
        <Label>Due date</Label>
        <Input type="datetime-local" value={toLocalDateTimeInput(form.dueAt)} onChange={(e) => setForm({ ...form, dueAt: new Date(e.target.value).toISOString() })} />
      </div>
      <div className="grid gap-1">
        <Label>Points</Label>
        <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
      </div>
      <div className="md:col-span-2 grid gap-1">
        <Label>Instructions</Label>
        <Textarea rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
      </div>
      <div className="md:col-span-2 pt-2">
        <Button onClick={() => onCreate(form.courseId, form)} disabled={!form.courseId || !form.title}>Create Assignment</Button>
      </div>
    </div>
  );
}

function SubmitForm({ onSubmit }) {
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label>Upload (simulated)</Label>
        <Input placeholder="e.g., hw1.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label>Note</Label>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="pt-2"><Button onClick={() => onSubmit(fileName || "submission.txt", note)}>Submit</Button></div>
    </div>
  );
}

function SubmissionsList({ assignment, db, onGrade }) {
  const subs = db.submissions.filter((s) => s.assignmentId === assignment.id);
  return (
    <div className="space-y-3">
      {subs.length === 0 && <p className="text-sm text-slate-500">No submissions yet.</p>}
      {subs.map((s) => (
        <div key={s.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{db.users.find((u) => u.id === s.userId)?.name}</div>
              <div className="text-xs text-slate-500">{new Date(s.submittedAt).toLocaleString()} • {s.fileName}</div>
              {s.note && <div className="text-sm mt-1">Note: {s.note}</div>}
            </div>
            <GradeEditor submission={s} onGrade={onGrade} db={db} />
          </div>
          {db.grades.find((g) => g.submissionId === s.id) && (
            <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-2 text-sm">
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-600" />
              Graded: {db.grades.find((g) => g.submissionId === s.id)?.score} / {assignment.points} — {db.grades.find((g) => g.submissionId === s.id)?.feedback}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GradeEditor({ submission, onGrade, db }) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const existing = db.grades.find((g) => g.submissionId === submission.id);
  return (
    <div className="grid gap-2 w-64">
      {existing ? (
        <div className="text-sm text-slate-600">Already graded • {existing.score} pts</div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} value={score} onChange={(e) => setScore(Number(e.target.value))} />
            <span className="text-sm text-slate-500">pts</span>
          </div>
          <Textarea rows={2} placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <Button size="sm" onClick={() => onGrade(submission.id, score, feedback)}>Publish grade</Button>
        </>
      )}
    </div>
  );
}

// ---------------------------- Grades ----------------------------
function GradesTab({ user, db }) {
  if (user.role !== "student") return (
    <Section title="Gradebook" description="Switch to a student account to preview transcript.">
      <p className="text-sm text-slate-600">Faculty can view grades via Assignments → View Submissions.</p>
    </Section>
  );

  const mySubs = db.submissions.filter((s) => s.userId === user.id);
  const rows = mySubs.map((s) => {
    const a = db.assignments.find((x) => x.id === s.assignmentId);
    const c = db.courses.find((x) => x.id === a?.courseId);
    const g = db.grades.find((x) => x.submissionId === s.id);
    return { id: s.id, course: c?.code, assignment: a?.title, points: a?.points ?? 0, score: g?.score, feedback: g?.feedback };
  });
  const totalEarned = rows.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const totalPoints = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
  const pct = totalPoints ? Math.round((totalEarned / totalPoints) * 100) : 0;

  return (
    <div className="grid gap-6">
      <Section title="My Grades" description="Published grades & feedback">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-500">No grades yet.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.course}</TableCell>
                  <TableCell>{r.assignment}</TableCell>
                  <TableCell>{r.score != null ? `${r.score} / ${r.points}` : "—"}</TableCell>
                  <TableCell>{r.feedback || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 text-sm text-slate-600">Cumulative: <span className="font-medium">{pct}%</span> ({totalEarned} / {totalPoints})</div>
      </Section>
    </div>
  );
}

// ---------------------------- Calendar & Timetable ----------------------------
function CalendarTab({ user, db, setDb }) {
  const myCourseIds = useMemo(() => {
    if (user.role === "student") return new Set(db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId));
    if (user.role === "faculty") return new Set(db.courses.filter((c) => c.facultyId === user.id).map((c) => c.id));
    return new Set(db.courses.map((c) => c.id));
  }, [db, user]);

  const myTimetable = db.timetable.filter((t) => myCourseIds.has(t.courseId));

  const addEvent = (ev) => setDb((d) => ({ ...d, calendarEvents: [ev, ...d.calendarEvents] }));

  return (
    <div className="grid gap-6">
      <Section title="Academic Calendar" description="Institution-wide dates">
        <AddEventForm onAdd={(title, date, type) => addEvent({ id: uid("ev"), title, date: new Date(date).toISOString(), type })} />
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {db.calendarEvents.map((ev) => (
            <div key={ev.id} className="rounded-xl border p-3 bg-white">
              <div className="font-medium">{ev.title}</div>
              <div className="text-sm text-slate-600">{new Date(ev.date).toDateString()} • <Badge variant="secondary">{ev.type}</Badge></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Weekly Timetable" description="Your classes this week">
        <WeeklyGrid timetable={myTimetable} courses={db.courses} />
      </Section>
    </div>
  );
}

function AddEventForm({ onAdd }) {
  const [form, setForm] = useState({ title: "", date: todayISO(), type: "academic" });
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="grid gap-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid gap-1">
        <Label>Date</Label>
        <Input type="date" value={toLocalDateInput(form.date)} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} />
      </div>
      <div className="grid gap-1">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-3 pt-2"><Button onClick={() => onAdd(form.title, form.date, form.type)} disabled={!form.title}>Add Event</Button></div>
    </div>
  );
}

function WeeklyGrid({ timetable, courses }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grouped = days.map((_, idx) => timetable.filter((t) => t.day === idx));
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => (
        <div key={d} className="rounded-xl border bg-white">
          <div className="p-2 border-b font-medium">{d}</div>
          <div className="p-2 space-y-2 min-h-[140px]">
            {grouped[i].map((t) => {
              const c = courses.find((x) => x.id === t.courseId);
              return (
                <div key={t.id} className="rounded-lg border p-2">
                  <div className="text-sm font-medium">{c?.code}</div>
                  <div className="text-xs text-slate-600">{t.start}–{t.end} • {t.room}</div>
                </div>
              );
            })}
            {grouped[i].length === 0 && (
              <div className="text-xs text-slate-500">No classes</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------- Messaging ----------------------------
function MessagingTab({ user, db, setDb }) {
  const myCourseIds = useMemo(() => {
    if (user.role === "student") return new Set(db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId));
    if (user.role === "faculty") return new Set(db.courses.filter((c) => c.facultyId === user.id).map((c) => c.id));
    return new Set(db.courses.map((c) => c.id));
  }, [db, user]);

  const threads = db.messages
    .filter((m) => myCourseIds.has(m.courseId))
    .reduce((acc, m) => {
      acc[m.threadId] = acc[m.threadId] || { threadId: m.threadId, courseId: m.courseId, title: m.title, messages: [] };
      acc[m.threadId].messages.push(m);
      return acc;
    }, {});

  const [compose, setCompose] = useState({ courseId: [...myCourseIds][0], title: "", body: "" });

  const sendMessage = (courseId, title, body) => {
    const threadId = uid("th");
    const msg = { id: uid("msg"), threadId, courseId, title, body, authorId: user.id, createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, messages: [msg, ...d.messages] }));
  };

  const reply = (threadId, body) => {
    const any = db.messages.find((m) => m.threadId === threadId);
    const msg = { id: uid("msg"), threadId, courseId: any.courseId, title: any.title, body, authorId: user.id, createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, messages: [msg, ...d.messages] }));
  };

  return (
    <div className="grid gap-6">
      <Section title="New Thread" description="Start a course-scoped discussion">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="grid gap-1">
            <Label>Course</Label>
            <Select value={compose.courseId} onValueChange={(v) => setCompose({ ...compose, courseId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[...myCourseIds].map((id) => {
                  const c = db.courses.find((x) => x.id === id);
                  return <SelectItem key={id} value={id}>{c?.code} — {c?.title}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 grid gap-3">
            <div className="grid gap-1">
              <Label>Title</Label>
              <Input value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Message</Label>
              <Textarea rows={3} value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
            </div>
            <div className="pt-1"><Button onClick={() => sendMessage(compose.courseId, compose.title, compose.body)} disabled={!compose.title || !compose.body}>Post Thread</Button></div>
          </div>
        </div>
      </Section>

      <Section title="Threads" description="Recent course discussions">
        <div className="space-y-3">
          {Object.values(threads).length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
          {Object.values(threads).map((t) => (
            <div key={t.threadId} className="rounded-xl border bg-white">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="font-medium">{t.title}</div>
                <Badge variant="secondary">{db.courses.find((c) => c.id === t.courseId)?.code}</Badge>
              </div>
              <div className="p-3 space-y-2">
                {[...t.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((m) => (
                  <div key={m.id} className="rounded-lg border p-2">
                    <div className="text-sm font-medium">{db.users.find((u) => u.id === m.authorId)?.name}</div>
                    <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</div>
                    <p className="text-sm mt-1">{m.body}</p>
                  </div>
                ))}
                <ReplyBox onSend={(text) => reply(t.threadId, text)} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ReplyBox({ onSend }) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder="Write a reply…" value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={() => { onSend(text); setText(""); }}>Send</Button>
    </div>
  );
}

// ---------------------------- Admin ----------------------------
function AdminTab({ db, setDb }) {
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "pass", role: "student" });

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user = { id: uid("u"), ...newUser };
    setDb((d) => ({ ...d, users: [...d.users, user] }));
    setNewUser({ name: "", email: "", password: "pass", role: "student" });
  };

  const changeRole = (userId, role) => setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, role } : u)) }));

  return (
    <div className="grid gap-6">
      <Section title="Users" description="Create accounts & manage roles">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          </div>
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div className="grid gap-1">
            <Label>Role</Label>
            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={addUser} className="w-full">Add User</Button></div>
        </div>

        <div className="mt-4 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------- Overview ----------------------------
function Overview({ user, db }) {
  const myCourseIds = useMemo(() => {
    if (user.role === "student") return new Set(db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId));
    if (user.role === "faculty") return new Set(db.courses.filter((c) => c.facultyId === user.id).map((c) => c.id));
    return new Set(db.courses.map((c) => c.id));
  }, [db, user]);

  const upcomingAssignments = db.assignments
    .filter((a) => myCourseIds.has(a.courseId))
    .filter((a) => new Date(a.dueAt) > new Date())
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5);

  const latestAnnouncements = db.announcements
    .filter((a) => myCourseIds.has(a.courseId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Section title="Upcoming" description="Next deadlines & events">
        <div className="space-y-2">
          {upcomingAssignments.map((a) => {
            const c = db.courses.find((x) => x.id === a.courseId);
            return (
              <div key={a.id} className="rounded-lg border p-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{a.title}</div>
                  <Badge variant="secondary">{c?.code}</Badge>
                </div>
                <div className="text-xs text-slate-600">Due {new Date(a.dueAt).toLocaleString()}</div>
              </div>
            );
          })}
          {upcomingAssignments.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
        </div>
      </Section>
      <Section title="Announcements" description="Recent course updates">
        <div className="space-y-2">
          {latestAnnouncements.map((a) => {
            const c = db.courses.find((x) => x.id === a.courseId);
            return (
              <div key={a.id} className="rounded-lg border p-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{a.title}</div>
                  <Badge variant="secondary">{c?.code}</Badge>
                </div>
                <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
                <p className="text-sm mt-1">{a.body}</p>
              </div>
            );
          })}
          {latestAnnouncements.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------- Date helpers ----------------------------
function toLocalDateInput(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function toLocalDateTimeInput(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// ---------------------------- Root Component ----------------------------
export default function CMSApp() {
  const [user, setUser] = useState(null);
  return user ? (
    <Dashboard user={user} onLogout={() => setUser(null)} />
  ) : (
    <AuthGate onLogin={setUser} />
  );
}
