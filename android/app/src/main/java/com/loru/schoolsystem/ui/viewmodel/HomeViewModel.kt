package com.loru.schoolsystem.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.data.repository.SchoolRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HomeViewModel(private val repository: SchoolRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            repository.getSchoolData().collect { data ->
                if (data != null) {
                    _uiState.value = HomeUiState.Success(data)
                } else {
                    _uiState.value = HomeUiState.Error("Failed to load school data")
                }
            }
        }
    }
}

sealed class HomeUiState {
    object Loading : HomeUiState()
    data class Success(val data: SchoolSystemData) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}
