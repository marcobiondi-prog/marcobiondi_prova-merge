import db from '../config/db.js';

export const getMembers = (req, res) => {
  db.all('SELECT * FROM members', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const createMember = (req, res) => {
  const { id, name, email, role, color } = req.body;
  db.run(
    'INSERT INTO members (id, name, email, role, color) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, role, color],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, email, role, color });
    }
  );
};

// Uniche colonne modificabili tramite PUT, per evitare SQL injection
// sui nomi di colonna a partire da req.body.
const UPDATABLE_MEMBER_FIELDS = ['name', 'email', 'role', 'color'];

export const updateMember = (req, res) => {
  const { id } = req.params;
  const updates = {};
  for (const field of UPDATABLE_MEMBER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  }
  const fields = Object.keys(updates);

  if (fields.length === 0) return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE members SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...updates });
  });
};

export const deleteMember = (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('UPDATE tasks SET assigneeId = NULL WHERE assigneeId = ?', [id]);
    db.run('DELETE FROM members WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Membro rimosso con successo' });
    });
  });
};
