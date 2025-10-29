import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../supabase/supabase';
import UserCard from '../../components/admin/UserCard';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.log(error);
    else setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
});
