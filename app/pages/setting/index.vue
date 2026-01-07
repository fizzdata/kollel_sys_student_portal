<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

const show = ref(false);
const newshow = ref(false);
const confirmshow = ref(false);
</script>

<template>
  <UContainer>
    <!-- Settings forms -->
    <div class="divide-y divide-gray-200">
      <div
        class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3 py-10"
      >
        <div>
          <h2 class="text-base/7 font-semibold text-gray-900">
            Personal Information
          </h2>
          <p class="mt-1 text-sm/6 text-gray-500">
            Use a permanent address where you can receive mail.
          </p>
        </div>

        <div class="md:col-span-2">
          <div
            class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6"
          >
            <div class="col-span-full flex items-center gap-x-8">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
                class="size-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5"
              />
              <div>
                <button
                  type="button"
                  class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-100"
                >
                  Change avatar
                </button>
                <p class="mt-2 text-xs/5 text-gray-500">
                  JPG, GIF or PNG. 1MB max.
                </p>
              </div>
            </div>

            <UForm @submit="isSubmit" class="col-span-full">
              <div class="flex justify-between mb-4 gap-4">
                <div class="w-full">
                  <UFormField label="First Name" name="first_name">
                    <UInput
                      placeholder="Enter First Name"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <div class="w-full">
                  <UFormField label="Last Name" name="last_name">
                    <UInput
                      placeholder="Enter Last Name"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>

              <UFormField label="Email Address" name="email">
                <UInput
                  type="password"
                  placeholder="Enter your password"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </div>

          <div class="mt-8 flex">
            <UButton type="submit" size="lg"> Save </UButton>
          </div>
        </div>
      </div>

      <div
        class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3"
      >
        <div>
          <h2 class="text-base/7 font-semibold text-gray-900">
            Change password
          </h2>
          <p class="mt-1 text-sm/6 text-gray-500">
            Update your password associated with your account.
          </p>
        </div>

        <div class="md:col-span-2">
          <div
            class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6"
          >
            <div class="col-span-full flex flex-col gap-4">
              <UFormField label="Current Password" name="current_password">
                <UInput
                  placeholder="Current Password"
                  :type="show ? 'text' : 'password'"
                  :ui="{ trailing: 'pe-1' }"
                  size="lg"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="show ? 'Hide password' : 'Show password'"
                      :aria-pressed="show"
                      aria-controls="password"
                      @click="show = !show"
                    />
                  </template>
                </UInput>
              </UFormField>
              <UFormField label="New Password" name="new_password">
                <UInput
                  placeholder="New Password"
                  :type="newshow ? 'text' : 'password'"
                  :ui="{ trailing: 'pe-1' }"
                  size="lg"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="newshow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="newshow ? 'Hide password' : 'Show password'"
                      :aria-pressed="newshow"
                      aria-controls="password"
                      @click="newshow = !newshow"
                    />
                  </template>
                </UInput>
              </UFormField>
              <UFormField label="Confirm Password" name="confirm_password">
                <UInput
                  placeholder="Confirm Password"
                  :type="confirmshow ? 'text' : 'password'"
                  :ui="{ trailing: 'pe-1' }"
                  size="lg"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="confirmshow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="
                        confirmshow ? 'Hide password' : 'Show password'
                      "
                      :aria-pressed="confirmshow"
                      aria-controls="password"
                      @click="confirmshow = !confirmshow"
                    />
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <div class="mt-8 flex">
            <UButton type="submit" size="lg"> Save </UButton>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
