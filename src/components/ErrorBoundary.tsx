import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import themeData from '../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: string | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bir hata oluştu</Text>
        <Text style={styles.message}>{this.state.error}</Text>
        <TouchableOpacity style={styles.btn} onPress={this.handleReset} activeOpacity={0.8}>
          <Text style={styles.btnText}>Yeniden Dene</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SP.lg,
  },
  title: {
    color: C.danger,
    fontSize: TY.size_h5,
    fontWeight: TY.weight_bold,
    marginBottom: SP.sm,
    textAlign: 'center',
  },
  message: {
    color: C.text_secondary,
    fontSize: TY.size_sm,
    textAlign: 'center',
    marginBottom: SP.lg,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: R.md,
    paddingVertical: SP.sm,
    paddingHorizontal: SP.lg,
  },
  btnText: {
    color: C.text_primary,
    fontSize: TY.size_body,
    fontWeight: TY.weight_semi,
  },
})
