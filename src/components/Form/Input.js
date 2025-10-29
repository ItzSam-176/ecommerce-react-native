// import React, { useState } from 'react';
// import { TextInput, StyleSheet, View, TouchableOpacity } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const Input = ({
//   value,
//   onChangeText,
//   placeholder,
//   keyboardType = 'default',
//   secureTextEntry = false,
//   style,
// }) => {
//   const [hidePassword, setHidePassword] = useState(secureTextEntry);

//   return (
//     <View style={styles.wrapper}>
//       <View style={styles.inputContainer}>
//         <TextInput
//           value={value}
//           onChangeText={onChangeText}
//           placeholder={placeholder}
//           keyboardType={keyboardType}
//           secureTextEntry={hidePassword}
//           style={[styles.input, style]}
//           placeholderTextColor="#888"
//         />
//         {secureTextEntry && (
//           <TouchableOpacity
//             style={styles.iconWrapper}
//             onPress={() => setHidePassword(!hidePassword)}
//           >
//             <Ionicons
//               name={hidePassword ? 'eye-off' : 'eye'}
//               size={20}
//               color="#666"
//             />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// };

// export default Input;

// const styles = StyleSheet.create({
//   wrapper: {
//     marginBottom: 12,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 10,
//     elevation: 2,
//     paddingHorizontal: 10,
//   },
//   input: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//   },
//   iconWrapper: {
//     paddingHorizontal: 6,
//   },
// });


import React, { useState } from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Input = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
}) => {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={hidePassword}
          style={[styles.input, style]}
          placeholderTextColor="#8a9fb5"
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => setHidePassword(!hidePassword)}
          >
            <Ionicons
              name={hidePassword ? 'eye-off' : 'eye'}
              size={20}
              color="#4fc3f7"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3847',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    elevation: 2,
    paddingHorizontal: 10,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  iconWrapper: {
    paddingHorizontal: 6,
  },
});
