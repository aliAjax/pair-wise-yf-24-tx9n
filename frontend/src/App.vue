<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";
import { computed } from "vue";
import { navRoutes } from "./router/routes";
import StatusBadge from "./components/common/StatusBadge.vue";

const route = useRoute();
const currentName = computed(() => (route.name as string | undefined) ?? "版本对比");
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">隐私政策差异对比器</div>
      <nav>
        <RouterLink
          v-for="item in navRoutes"
          :key="item.route"
          :to="item.route"
          class="nav-link"
          :class="{ active: route.path === item.route }"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">policy-diff</p>
          <h1>{{ currentName }}</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>
      <RouterView />
    </main>
  </div>
</template>
