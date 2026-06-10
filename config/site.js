const contacts = {
  email: 'vvkoil@mail.ru',
  phones: [
    '+7 908 990 89 99',
    '+7 908 990 98 99'
  ],
  phoneLinks: [
    '+79089908999',
    '+79089909899'
  ]
};

module.exports = {
  company: {
    name: 'ООО «Примаслоторг»'
  },
  companyName: 'ПРИМ МАСЛО ТОРГ',
  legalName: 'ООО «Примаслоторг»',
  contacts,
  email: contacts.email,
  emailHref: `mailto:${contacts.email}`,
  address: 'Приморский край, г. Уссурийск, ул. Московская, 12',
  phones: contacts.phones,
  phoneLinks: contacts.phoneLinks,
  phone: contacts.phones[0],
  phoneHref: `tel:${contacts.phoneLinks[0]}`
};
