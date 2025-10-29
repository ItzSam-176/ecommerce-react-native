import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const UserCard = ({ user }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.name}</Text>
        {user.role === 'admin' && (
          <Image
            source={require('../../assets/admin_badge.png')}
            style={styles.badge}
          />
        )}
      </View>
      <Text style={styles.detail}>✉️ {user.email}</Text>
      <Text style={styles.detail}>📞 {user.phone}</Text>
    </View>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a3847',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#fff',
  },
  badge: {
    width: 24,
    height: 24,
    marginLeft: 8,
    resizeMode: 'contain',
    tintColor: '#4fc3f7',
  },
  detail: {
    fontSize: 14,
    color: '#8a9fb5',
    marginVertical: 2,
  },
});
