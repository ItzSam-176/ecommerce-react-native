// src/components/tour/CustomTooltip.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CustomTooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
}) => {
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const totalSteps = 8; // Updated to 8 zones

  useEffect(() => {
    if (currentStep?.order) {
      setCurrentStepNumber(currentStep.order);
    }
  }, [currentStep]);

  return (
    <View style={styles.tooltipContainer}>
      <LinearGradient colors={['#2a3847', '#1f2937']} style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>{currentStep?.text}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip Tour</Text>
          </TouchableOpacity>

          <View style={styles.navButtons}>
            {!isFirstStep && (
              <TouchableOpacity
                style={styles.prevButton}
                onPress={handlePrev}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={20} color="#8a9fb5" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={isLastStep ? handleStop : handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Text>
                {!isLastStep && (
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            Step {currentStepNumber} of {totalSteps}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  tooltip: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    minWidth: 280,
    maxWidth: 320,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#8a9fb5',
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  prevButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 12,
    color: '#4fc3f7',
    fontWeight: '500',
  },
});

export default CustomTooltip;
