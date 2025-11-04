if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/zluck/.gradle/caches/8.14.3/transforms/0bff1788fe0963756845e89efee59cb2/transformed/hermes-android-0.81.4-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/zluck/.gradle/caches/8.14.3/transforms/0bff1788fe0963756845e89efee59cb2/transformed/hermes-android-0.81.4-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

