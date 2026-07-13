import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import SkillTagInput from '../components/SkillTagInput';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseProjects(jsonStr) {
  try { return JSON.parse(jsonStr || '[]'); } catch { return []; }
}

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name:              user.name,
    email:             user.email,
    password:          '',
    age:               user.age,
    bio:               user.bio || '',
    githubUrl:         user.githubUrl || '',
    linkedinUrl:       user.linkedinUrl || '',
    websiteUrl:        user.websiteUrl || '',
    learningPlatforms: user.learningPlatforms || '',
  });

  const [projects, setProjects] = useState(parseProjects(user.projects));

  // each project: { title, description, url, tags (array) }
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '', tags: '' });
  const [addingProject, setAddingProject] = useState(false);

  const [saving, setSaving]             = useState(false);
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [skillsState, setSkillsState]   = useState({
    OFFER: (user.skills || []).filter(s => s.type === 'OFFER'),
    WANT:  (user.skills || []).filter(s => s.type === 'WANT'),
  });
  const [addingSkill, setAddingSkill]   = useState(false);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg); else setMessage(msg);
    setTimeout(() => { setError(''); setMessage(''); }, 3500);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const updated = await userService.updateProfile({
        ...form,
        age: Number(form.age) || 0,
        projects: JSON.stringify(projects),
      });
      updateLocalUser(updated);
      setForm(f => ({ ...f, password: '' }));
      flash('Profile updated successfully.');
    } catch (err) {
      flash(err.response?.data?.message || 'Could not update profile.', true);
    } finally { setSaving(false); }
  };

  // ── Photo ────────────────────────────────────────────────────────────────
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const updated = await userService.uploadPhoto(file);
      updateLocalUser(updated);
      flash('Photo updated.');
    } catch (err) {
      flash(err.response?.data?.message || 'Photo upload failed.', true);
    } finally { setUploadingPhoto(false); }
  };

  // ── Skills ───────────────────────────────────────────────────────────────
  const handleAddSkill = async (skillName, type) => {
    // Optimistic UI: add a temporary entry immediately so it appears at once
    const tempSkill = { id: null, skillName, type };
    setSkillsState(prev => ({ ...prev, [type]: [...prev[type], tempSkill] }));
    setAddingSkill(true);
    try {
      const updated = await userService.addSkill(skillName, type);
      updateLocalUser(updated);
      // Replace optimistic entry with confirmed server data
      setSkillsState({
        OFFER: updated.skills.filter(s => s.type === 'OFFER'),
        WANT:  updated.skills.filter(s => s.type === 'WANT'),
      });
    } catch (err) {
      // Rollback optimistic update
      setSkillsState(prev => ({
        ...prev,
        [type]: prev[type].filter(s => s !== tempSkill),
      }));
      flash(err.response?.data?.message || 'Could not add skill.', true);
    } finally { setAddingSkill(false); }
  };

  const handleRemoveSkill = async (index, type) => {
    const skill = skillsState[type][index];
    if (!skill?.id) return;
    // Optimistic UI: remove immediately so it disappears at once
    const prevSkills = skillsState[type];
    setSkillsState(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
    try {
      const updated = await userService.removeSkill(skill.id);
      updateLocalUser(updated);
      // Confirm with server-authoritative list
      setSkillsState({
        OFFER: updated.skills.filter(s => s.type === 'OFFER'),
        WANT:  updated.skills.filter(s => s.type === 'WANT'),
      });
    } catch (err) {
      // Rollback
      setSkillsState(prev => ({ ...prev, [type]: prevSkills }));
      flash(err.response?.data?.message || 'Could not remove skill.', true);
    }
  };

  // ── Projects ─────────────────────────────────────────────────────────────
  const addProject = () => {
    if (!newProject.title.trim()) return;
    const tags = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
    setProjects(p => [...p, { ...newProject, tags, url: newProject.url.trim() }]);
    setNewProject({ title: '', description: '', url: '', tags: '' });
    setAddingProject(false);
  };

  const removeProject = (idx) => setProjects(p => p.filter((_, i) => i !== idx));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div><h1>Your profile</h1><p>Update your details, links, projects and skills.</p></div>
      </div>

      {message && (
        <div className="error-banner" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', marginBottom: 14 }}>
          ✓ {message}
        </div>
      )}
      {error && <div className="error-banner" style={{ marginBottom: 14 }}>{error}</div>}

      {/* ── Photo ── */}
      <SectionCard title="Profile photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--color-give-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', fontSize: '2rem', flexShrink: 0,
          }}>
            {user.profilePhotoUrl
              ? <img src={API + user.profilePhotoUrl} alt={user.name}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}>
              {uploadingPhoto ? 'Uploading…' : 'Change photo'}
            </button>
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>JPG, PNG or GIF · max 5 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
      </SectionCard>

      {/* ── Skills ── */}
      <SectionCard title="Skills">
        <SkillTagInput
          label="Skills you can teach (OFFER)"
          skills={skillsState.OFFER.map(s => s.skillName)}
          onAdd={handleAddSkill} onRemove={handleRemoveSkill}
          type="OFFER" placeholder="e.g. Excel, Yoga, Drawing…"
        />
        <SkillTagInput
          label="Skills you want to learn (WANT)"
          skills={skillsState.WANT.map(s => s.skillName)}
          onAdd={handleAddSkill} onRemove={handleRemoveSkill}
          type="WANT" placeholder="e.g. Guitar, Python, Spanish…"
        />
        {addingSkill && <p className="muted" style={{ fontSize: '0.82rem' }}>Saving…</p>}
      </SectionCard>

      <form onSubmit={handleSubmit}>
        {/* ── Basic info ── */}
        <SectionCard title="Basic info">
          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" type="number" min="0" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" type="password" value={form.password}
              placeholder="Leave blank to keep current" onChange={e => set('password', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" rows={3} maxLength={500} value={form.bio}
              placeholder="Tell others about yourself…" onChange={e => set('bio', e.target.value)} />
            <p className="muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>{form.bio.length}/500</p>
          </div>
        </SectionCard>

        {/* ── Social links ── */}
        <SectionCard title="Social & professional links">
          <p className="muted" style={{ fontSize: '0.83rem', marginBottom: 14 }}>
            These links are shown publicly on your profile so others can connect with you.
          </p>

          <div className="field">
            <label htmlFor="github">
              <span style={{ marginRight: 6 }}>🐙</span> GitHub URL
            </label>
            <input id="github" type="url" value={form.githubUrl}
              placeholder="https://github.com/yourname"
              onChange={e => set('githubUrl', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="linkedin">
              <span style={{ marginRight: 6 }}>💼</span> LinkedIn URL
            </label>
            <input id="linkedin" type="url" value={form.linkedinUrl}
              placeholder="https://linkedin.com/in/yourname"
              onChange={e => set('linkedinUrl', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="website">
              <span style={{ marginRight: 6 }}>🌐</span> Personal website / portfolio
            </label>
            <input id="website" type="url" value={form.websiteUrl}
              placeholder="https://yourportfolio.com"
              onChange={e => set('websiteUrl', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="platforms">
              <span style={{ marginRight: 6 }}>📚</span> Learning platforms
            </label>
            <input id="platforms" value={form.learningPlatforms}
              placeholder="https://coursera.org/in/you, https://udemy.com/user/you"
              onChange={e => set('learningPlatforms', e.target.value)} />
            <p className="muted" style={{ fontSize: '0.75rem', marginTop: 3 }}>
              Separate multiple links with commas (Coursera, Udemy, edX, freeCodeCamp…)
            </p>
          </div>
        </SectionCard>

        {/* ── Projects ── */}
        <SectionCard title="Projects">
          <p className="muted" style={{ fontSize: '0.83rem', marginBottom: 14 }}>
            Showcase your work so others know what you've built.
          </p>

          {/* Existing projects */}
          {projects.map((p, i) => (
            <div key={i} style={{
              border: '1px solid var(--color-border)', borderRadius: 8,
              padding: '12px 14px', marginBottom: 10, position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{p.title}</p>
                  {p.description && (
                    <p className="muted" style={{ fontSize: '0.84rem', margin: '0 0 6px' }}>{p.description}</p>
                  )}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--color-brand, #16a34a)' }}>
                      🔗 {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {p.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.tags.map(t => (
                        <span key={t} style={{
                          fontSize: '0.72rem', padding: '1px 8px', borderRadius: 99,
                          background: 'var(--color-give-bg)', color: 'var(--color-give)',
                          fontWeight: 600,
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => removeProject(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1rem' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Add project form */}
          {addingProject ? (
            <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div className="field">
                <label>Project title *</label>
                <input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Brofessor Skill Exchange" />
              </div>
              <div className="field">
                <label>Short description</label>
                <textarea rows={2} value={newProject.description}
                  onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                  placeholder="What does this project do?" />
              </div>
              <div className="field">
                <label>Project URL</label>
                <input type="url" value={newProject.url}
                  onChange={e => setNewProject(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://github.com/you/project" />
              </div>
              <div className="field">
                <label>Tech / tags</label>
                <input value={newProject.tags}
                  onChange={e => setNewProject(p => ({ ...p, tags: e.target.value }))}
                  placeholder="React, Spring Boot, MySQL" />
                <p className="muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>Comma-separated</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary btn-sm"
                  disabled={!newProject.title.trim()} onClick={addProject}>
                  Add project
                </button>
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => { setAddingProject(false); setNewProject({ title: '', description: '', url: '', tags: '' }); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingProject(true)}>
              + Add project
            </button>
          )}
        </SectionCard>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginBottom: 32 }}>
          {saving ? 'Saving…' : 'Save all changes'}
        </button>
      </form>
    </div>
  );
}
