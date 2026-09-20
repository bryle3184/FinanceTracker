// @ts-check
import { useState } from 'react';
import { MessageSquare, Trash2, CornerDownRight } from 'lucide-react';
import { useStore } from '../../state/store.js';
import Avatar from '../../components/shared/Avatar.jsx';
import Field from '../../components/shared/Field.jsx';

const time = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * Thread-style comments for a transaction (top-level + one level of replies).
 * Authors are household members. Comments cascade-delete children on delete.
 */
export default function CommentsThread({ transactionId }) {
  const comments = useStore((s) => s.comments);
  const members = useStore((s) => s.members);
  const defaultMemberId = useStore((s) => s.settings.defaultMemberId);
  const addComment = useStore((s) => s.addComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const pushToast = useStore((s) => s.pushToast);

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  const txComments = comments
    .filter((c) => c.transactionId === transactionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const authorOf = (id) => members.find((m) => m.id === id);

  const submit = () => {
    if (!body.trim()) return;
    addComment({ transactionId, authorMemberId: defaultMemberId, body: body.trim() });
    setBody('');
  };

  const submitReply = (parentId) => {
    if (!replyBody.trim()) return;
    addComment({ transactionId, authorMemberId: defaultMemberId, body: replyBody.trim(), parentId });
    setReplyBody('');
    setReplyTo(null);
  };

  const remove = (id) => {
    deleteComment(id);
    pushToast('Comment deleted');
  };

  const Comment = ({ comment, isReply = false }) => {
    const author = authorOf(comment.authorMemberId);
    return (
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingLeft: isReply ? '22px' : 0 }}>
        <Avatar member={author} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>{author?.name || 'Unknown'}</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>{time(comment.createdAt)}</span>
            <button
              style={{ marginLeft: 'auto', color: 'var(--text-faint)', padding: 2 }}
              onClick={() => remove(comment.id)}
              aria-label="Delete comment"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--fs-sm)', whiteSpace: 'pre-wrap' }}>{comment.body}</p>
          {!isReply && (
            <button
              style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', marginTop: 2 }}
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            >
              <CornerDownRight size={11} /> Reply
            </button>
          )}
          {replyTo === comment.id && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                className="input"
                style={{ minHeight: 34 }}
                placeholder="Write a reply…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitReply(comment.id)}
                autoFocus
              />
              <button className="btn btn-accent btn-sm" onClick={() => submitReply(comment.id)}>Reply</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 'var(--sp-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-md)', marginBottom: 'var(--sp-2)' }}>
        <MessageSquare size={16} /> Comments
      </h3>

      {txComments.filter((c) => !c.parentId).length === 0 && (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No comments yet.</p>
      )}

      {txComments
        .filter((c) => !c.parentId)
        .map((c) => (
          <div key={c.id}>
            <Comment comment={c} />
            {txComments.filter((child) => child.parentId === c.id).map((child) => (
              <Comment key={child.id} comment={child} isReply />
            ))}
          </div>
        ))}

      <Field>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn btn-ghost" onClick={submit}>Post</button>
        </div>
      </Field>
    </div>
  );
}