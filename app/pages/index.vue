<script setup>
const items = ref([
  {
    title: "Fingerprint Clocking and Session Control:",
    description:
      "<p>Each student is assigned a unique fingerprint for seamless clocking in and out. The system allows students to clock in only when a session is open, ensuring that they can only enter during active hours. There is an option to grant a small grace period before the session officially starts, providing flexibility. </p><p class='pt-2'> The system enforces a strict clock-out requirement at the end of each session, as well as before the session concludes if the student needs to leave early. The program ensures accurate tracking of attendance, based on these timestamps.</p>",
  },
  {
    title: "Automatic Attendance Calculations:",
    description:
      "<p>After clocking in and out, the system automatically calculates the percentage of time the student was present in the session and also tracks their total attendance over the entire month.  </p><p class='pt-2'> The percentage is calculated based on actual presence, providing a transparent and accurate representation of student participation. </p>",
  },
  {
    title: "Performance-Based Bonuses:",
    description:
      "<p>Students can earn small bonuses based on various factors, such as timely arrival, session attendance, or performance metrics configured by the administrator. </p> <p class='pt-2'> These bonuses are automatically applied to each student’s account based on the admin’s settings, such as the percentage of time attended or punctuality, ensuring an incentive-based system that encourages good habits. <p class='pt-2'> Students can later withdraw their bonuses at their convenience, allowing them to use the funds for their expenses. </p>",
  },
  {
    title: "Conditional Admin Questions:",
    description:
      "<p>The system includes a flexible admin feature where administrators can set conditional questions to be answered by students at the time of clocking in or out. For example, a question might ask if a student attended a particular class or if they need to report any issues.  </p><p class='pt-2'> Students can only clock in or out if they meet the conditions set by the administrator. If the question is not applicable, the admin can configure it to be optional, ensuring a customizable experience. </p>",
  },
  {
    title: "Comprehensive Reporting:",
    description:
      "<p>The system keeps detailed records of each student’s attendance, performance, and bonuses. Administrators can generate detailed reports based on a variety of parameters, such as individual attendance percentages, total hours attended, bonus calculations, and more.  </p><p class='pt-2'> These reports provide valuable insights into each student’s participation, enabling admins to track progress and address any concerns effectively. </p>",
  },
]);

const token = useCookie("kollel_sys_token");
const redirectTo = computed(() => (token.value ? "/users" : "/login"));
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="px-6 py-12">
      <h1 class="text-3xl font-semibold text-center text-primary mb-8">
        Comprehensive Attendance and Performance System for Kollelim
      </h1>
      <div class="text-center">
        <UButton size="xl" class="my-5" :to="redirectTo"
          >Go to your account</UButton
        >
      </div>
      <p class="text-lg text-gray-700 mb-6 font-medium">
        The program is a comprehensive and automated system designed for
        Kollelim, offering a highly organized solution for managing attendance,
        student performance, bonuses, and more. It integrates multiple features
        that streamline day-to-day operations and enhance efficiency.
      </p>
      <p class="text-2xl font-semibold text-primary mb-4">Key Features:</p>

      <UCard
        v-for="(item, index) in items"
        :key="index"
        class="relative rounded-2xl bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg mb-4 border-l-4 border-primary"
      >
        <div class="space-y-4">
          <!-- Title -->
          <h3 class="text-xl font-semibold text-gray-900">
            {{ item.title }}
          </h3>

          <!-- Content -->
          <div
            v-html="item?.description"
            class="text-md leading-relaxed text-gray-700 font-medium"
          ></div>
        </div>
      </UCard>
      <p class="text-2xl font-semibold text-primary mb-4">
        Additional Features:
      </p>
      <ul class="list-disc pl-4">
        <li>
          The system is designed to be user-friendly and fully integrated,
          reducing the need for manual tracking and ensuring that all data is
          automatically saved and processed.
        </li>
        <li>
          Data security and privacy are paramount, with all student information
          stored securely and accessible only to authorized personnel.
        </li>
      </ul>
    </div>
    <footer class="font-semibold text-center text-primary mb-8">
      <p class="font-bold text-primary sm:block">Powered by FizzData®</p>
    </footer>
  </div>
</template>
