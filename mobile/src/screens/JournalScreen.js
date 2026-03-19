import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TextInput, Alert } from 'react-native';
import axios from 'axios';

// Giả định JWT token lưu trong app (để gọi API)
const DUMMY_TOKEN = '';

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState('');

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/journal', {
        headers: { Authorization: `Bearer ${DUMMY_TOKEN}` }
      });
      setEntries(res.data.entries || []);
    } catch (err) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:3000/api/journal',
        { content: entry },
        { headers: { Authorization: `Bearer ${DUMMY_TOKEN}` } }
      );
      setEntry('');
      fetchJournalEntries();
    } catch (err) {
      Alert.alert('Error', 'Could not save journal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Journal Entries</Text>
      <TextInput
        style={styles.input}
        placeholder="Write something..."
        value={entry}
        onChangeText={setEntry}
      />
      <Button title="Add Entry" onPress={addEntry} />
      <FlatList
        data={entries}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.entryBox}>
            <Text>{item.content}</Text>
            <Text style={styles.entryDate}>{item.createdAt}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchJournalEntries}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 12, paddingHorizontal: 12 },
  entryBox: { padding: 10, borderBottomColor: '#ddd', borderBottomWidth: 1 },
  entryDate: { color: '#888', fontSize: 12 },
});
