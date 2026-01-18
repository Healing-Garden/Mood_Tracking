import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface JournalFormEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalFormEntry[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isWriting, setIsWriting] = useState<boolean>(false);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const newEntry: JournalFormEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setTitle('');
    setContent('');
    setIsWriting(false);
  };

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold text-primary">
        My Journal
      </h1>

      {isWriting ? (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">New Entry</h2>
          <div className="space-y-4">
            <Input
              placeholder="Entry title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2"
            />
            <textarea
              placeholder="Write your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-40 w-full rounded-lg border border-border p-3 resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
              >
                Save Entry
              </Button>
              <Button 
                onClick={() => setIsWriting(false)} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setIsWriting(true)}>
          Start Writing
        </Button>
      )}

      {entries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Entries</h2>
          {entries.map((entry) => (
            <Card key={entry.id} className="p-6">
              <h3 className="mb-2 font-bold text-primary">
                {entry.title}
              </h3>
              <p className="whitespace-pre-wrap">{entry.content}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}