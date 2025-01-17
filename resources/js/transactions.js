import { Modal } from 'bootstrap'
import { get, post, del } from './ajax'
import DataTable from 'datatables.net'

window.addEventListener('DOMContentLoaded', function () {
  const newTransactionModal = new Modal(
    document.getElementById('newTransactionModal')
  )
  const editTransactionModal = new Modal(
    document.getElementById('editTransactionModal')
  )
  const uploadReceiptModal = new Modal(
    document.getElementById('uploadReceiptModal')
  )

  const table = new DataTable('#transactionsTable', {
    serverSide: true,
    ajax: '/transactions/load',
    orderMulti: false,
    columns: [
      { data: 'description' },
      {
        data: row =>
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencySign: 'accounting'
          }).format(row.amount)
      },
      { data: 'category' },
      { data: 'date' },
      {
        sortable: false,
        data: row => `
                    <div class="d-flex flex-">
                        <button type="submit" class="btn btn-outline-primary delete-transaction-btn" data-id="${row.id}">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                        <button class="ms-2 btn btn-outline-primary edit-transaction-btn" data-id="${row.id}">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="ms-2 btn btn-outline-primary open-receipt-upload-btn" data-id="${row.id}">
                            <i class="bi bi-upload"></i>
                        </button>
                    </div>
                `
      }
    ]
  })

  document
    .querySelector('#transactionsTable')
    .addEventListener('click', function (event) {
      const editBtn = event.target.closest('.edit-transaction-btn')
      const deleteBtn = event.target.closest('.delete-transaction-btn')
      const uploadReceiptBtn = event.target.closest('.open-receipt-upload-btn')

      if (editBtn) {
        const transactionId = editBtn.getAttribute('data-id')

        get(`/transactions/${transactionId}`)
          .then(response => response.json())
          .then(response =>
            openEditTransactionModal(editTransactionModal, response)
          )
      } else if (deleteBtn) {
        const transactionId = deleteBtn.getAttribute('data-id')

        if (confirm('Are you sure you want to delete this transaction?')) {
          del(`/transactions/${transactionId}`).then(response => {
            if (response.ok) {
              table.draw()
            }
          })
        }
      } else if (uploadReceiptBtn) {
        const transactionId = uploadReceiptBtn.getAttribute('data-id')

        uploadReceiptModal._element
          .querySelector('.upload-receipt-btn')
          .setAttribute('data-id', transactionId)

        uploadReceiptModal.show()
      }
    })

  document
    .querySelector('.create-transaction-btn')
    .addEventListener('click', function (event) {
      post(
        `/transactions`,
        getTransactionFormData(newTransactionModal),
        newTransactionModal._element
      ).then(response => {
        if (response.ok) {
          table.draw()

          newTransactionModal.hide()
        }
      })
    })

  document
    .querySelector('.save-transaction-btn')
    .addEventListener('click', function (event) {
      const transactionId = event.currentTarget.getAttribute('data-id')

      post(
        `/transactions/${transactionId}`,
        getTransactionFormData(editTransactionModal),
        editTransactionModal._element
      ).then(response => {
        if (response.ok) {
          table.draw()
          editTransactionModal.hide()
        }
      })
    })

  document
    .querySelector('.upload-receipt-btn')
    .addEventListener('click', function (event) {
      const files =
        uploadReceiptModal._element.querySelector('input[type="file"]').files
      if (files.length === 0) return uploadReceiptModal.hide()

      const transactionId = event.currentTarget.getAttribute('data-id')
      const formData = new FormData()

      for (let i = 0; i < files.length; i++) {
        formData.append('receipt', files[i])
      }

      post(
        `/transactions/${transactionId}/receipts`,
        formData,
        uploadReceiptModal._element
      ).then(response => {
        if (response.ok) {
          table.draw()
          uploadReceiptModal.hide()
        }
      })
    })
})

function getTransactionFormData(modal) {
  let data = {}
  const fields = [
    ...modal._element.getElementsByTagName('input'),
    ...modal._element.getElementsByTagName('select')
  ]

  fields.forEach(select => {
    data[select.name] = select.value
  })

  return data
}

function openEditTransactionModal(modal, { id, ...data }) {
  for (let name in data) {
    const nameInput = modal._element.querySelector(`[name="${name}"]`)

    nameInput.value = data[name]
  }

  modal._element
    .querySelector('.save-transaction-btn')
    .setAttribute('data-id', id)

  modal.show()
}
