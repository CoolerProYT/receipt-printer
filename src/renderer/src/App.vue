<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
    <div class="max-w-3xl mx-auto bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-200">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">🧾 Receipt Designer</h1>

      <!-- Printer Selection -->
      <div class="mb-5">
        <label class="block text-sm font-semibold text-gray-600 mb-1">Printer</label>
        <select
          v-model="receipt.printer"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <option v-for="p in printers" :key="p.name" :value="p.name">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Logo Upload -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-gray-600 mb-2">Logo</label>
        <div class="flex items-center space-x-4">
          <div
            class="w-24 h-24 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="logoPreview"
              :src="logoPreview"
              alt="Logo Preview"
              class="object-contain w-full h-full"
            />
            <span v-else class="text-gray-400 text-xs">No Logo</span>
          </div>
          <div class="space-y-2">
            <input type="file" accept="image/*" @change="onLogoSelect" />
            <button
              v-if="logoPreview"
              @click="removeLogo"
              class="text-sm text-red-600 hover:underline"
            >
              Remove Logo
            </button>
          </div>
        </div>
      </div>

      <!-- Layout: 2 columns on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Left: Input Form -->
        <div class="space-y-6">
          <!-- Header -->
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Header Title</label>
            <input
              v-model="receipt.title"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="e.g. My Coffee Shop"
            />
          </div>

          <!-- Items -->
          <div>
            <h2 class="text-lg font-semibold text-gray-700 mb-3">Items</h2>
            <div
              v-for="(item, i) in receipt.items"
              :key="'item-' + i"
              class="flex items-center gap-2 mb-2"
            >
              <input
                v-model="item.name"
                placeholder="Item name"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <input
                v-model="item.price"
                placeholder="Price"
                class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <button
                class="text-red-500 hover:text-red-600 transition"
                @click="receipt.items.splice(i, 1)"
              >
                ✖
              </button>
            </div>
            <button
              @click="receipt.items.push({ name: '', price: '' })"
              class="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + Add Item
            </button>
          </div>

          <!-- Totals -->
          <div>
            <h2 class="text-lg font-semibold text-gray-700 mb-3">Totals</h2>
            <div
              v-for="(t, i) in receipt.totals"
              :key="'total-' + i"
              class="flex items-center gap-2 mb-2"
            >
              <input
                v-model="t.label"
                placeholder="Label"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <input
                v-model="t.value"
                placeholder="Value"
                class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <button
                class="text-red-500 hover:text-red-600 transition"
                @click="receipt.totals.splice(i, 1)"
              >
                ✖
              </button>
            </div>
            <button
              @click="receipt.totals.push({ label: '', value: '' })"
              class="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + Add Total Row
            </button>
          </div>

          <!-- Alignment -->
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Text Alignment</label>
            <select
              v-model="receipt.align"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="LEFT">Left</option>
              <option value="CENTER">Center</option>
              <option value="RIGHT">Right</option>
            </select>
          </div>
        </div>

        <!-- Right: Live Preview -->
        <div
          class="bg-gray-50 rounded-xl shadow-inner p-4 font-mono text-sm border border-gray-200 flex flex-col items-center"
        >
          <img
            v-if="logoPreview"
            :src="logoPreview"
            alt="Logo"
            class="h-16 mb-2 object-contain"
          />
          <div class="text-center font-bold text-gray-800">{{ receipt.title }}</div>
          <div class="border-t border-gray-300 my-2 w-full"></div>

          <div
            v-for="(item, i) in receipt.items"
            :key="'preview-item-' + i"
            class="flex justify-between text-gray-700 w-full"
          >
            <span>{{ item.name }}</span>
            <span>{{ item.price }}</span>
          </div>

          <div class="border-t border-gray-300 my-2 w-full"></div>

          <div
            v-for="(t, i) in receipt.totals"
            :key="'preview-total-' + i"
            class="flex justify-between font-semibold text-gray-800 w-full"
            :class="(i === receipt.totals.length - 1) ? 'border-t border-gray-300 my-2 w-full' : ''"
          >
            <span>{{ t.label }}</span>
            <span>{{ t.value }}</span>
          </div>
        </div>
      </div>

      <!-- Print Button -->
      <div class="mt-8 text-center">
        <button
          @click="printReceipt"
          class="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
        >
          🖨️ Print Receipt
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

const receipt = reactive({
  title: '',
  items: [
    { name: '', price: '' }
  ],
  totals: [
    { label: 'Subtotal', value: '0.00' },
    { label: 'Tax (5%)', value: '0.00' },
    { label: 'Total', value: '0.00' }
  ],
  align: 'CENTER',
  printer: ''
})

const printers = ref([])
const logoPreview = ref(null)

onMounted(async () => {
  printers.value = await window.electronAPI.getPrinters()
  if (printers.value.length > 0) receipt.printer = printers.value[0].name

  const savedLogo = await window.electronAPI.getLogoPath()
  if (savedLogo) logoPreview.value = savedLogo
})

async function onLogoSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = reader.result
    const savedPath = await window.electronAPI.saveLogo(base64)
    logoPreview.value = savedPath
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  logoPreview.value = null
}

async function printReceipt() {
  try {
    const plain = JSON.parse(JSON.stringify(receipt))
    const result = await window.electronAPI.printReceipt(plain)
    alert(result)
  } catch (err) {
    console.error(err)
    alert('Failed to print receipt!')
  }
}
</script>
