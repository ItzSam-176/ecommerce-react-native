import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import IconButton from './IconButton';

export default function CustomHeader({
  navigation,
  title,
  canGoBack,
  screenName,
  onSortPress,
  onLogout,
  route,
  onCustomizePress,
  onEditPress,
  isEditing,
  editLoading,
  onTogglePress,
  onSearchPress,
  selectMode,
  onToggleSelectMode,
}) {
  const isBottomSheetExpanded = route?.params?.isBottomSheetExpanded ?? false;
  return (
    <View style={styles.headerContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#353F54"
        translucent={false}
      />
      <View style={styles.header}>
        {canGoBack ? (
          <IconButton
            onPress={() => navigation.goBack()}
            iconName="arrow-back"
            size={22}
            containerStyle={styles.backButton}
          />
        ) : (
          <View />
        )}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightIcons}>
          {screenName === 'ProductsScreen' && (
            <>
              <IconButton
                onPress={() => navigation.navigate('AddProductsScreen')}
                iconName="add-circle-outline"
              />
              <IconButton onPress={onSortPress} iconName="filter-outline" />
              <IconButton
                onPress={() => {
                  const current =
                    navigation.getState()?.routes.find(r => r.key === route.key)
                      ?.params?.showSearchInput ?? false;
                  navigation.setParams({ showSearchInput: !current });
                }}
                iconName="search-outline"
              />
            </>
          )}

          {screenName === 'OrdersScreen' && (
            <IconButton
              onPress={onCustomizePress}
              isImage={true}
              imageSource={require('../../assets/four_squares.png')}
            />
          )}

          {screenName === 'Home' && (
            <>
              <IconButton
                onPress={() => navigation.navigate('WishlistScreen')}
                iconName="heart-outline"
              />
              <IconButton onPress={onSearchPress} iconName="search-outline" />
            </>
          )}

          {screenName === 'UserScreen' && onLogout && (
            <IconButton onPress={onLogout} iconName="log-out-outline" />
          )}

          {screenName === 'UserDetailsScreen' && onEditPress && (
            <IconButton
              onPress={onEditPress}
              iconName={isEditing ? 'checkmark' : 'create-outline'}
              size={22}
            />
          )}

          {/* Product Details Screen - Dynamic toggle button */}
          {screenName === 'ProductDetailsScreen' && onTogglePress && (
            <IconButton
              onPress={onTogglePress}
              iconName={isBottomSheetExpanded ? 'chevron-down' : 'chevron-up'}
              size={24}
            />
          )}
          {/* ✅ Cart Screen — Select mode toggle */}
          {screenName === 'Cart' && onToggleSelectMode && (
            <IconButton
              onPress={onToggleSelectMode}
              iconName={
                route?.params?.selectMode ? 'close' : 'checkbox-outline'
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#353F54',
  },
  header: {
    height: 56,
    backgroundColor: '#353F54',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 6,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 4,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
