import { useState } from "react"
import { motion } from "framer-motion"
import api from "../../../server/Api/api.js"

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  show: {
    opacity: 1,
    y: 0,
  },
}

const labelClass =
  "text-[8px] uppercase tracking-[0.2em] text-[#e5d4cc]/35"

const inputClass = `
  mt-3
  w-full
  border-0
  border-b
  border-[#e5d4cc]/20
  bg-transparent
  pb-3
  text-[12px]
  text-[#e5d4cc]
  outline-none
  transition-colors
  duration-300
  focus:border-[#e5d4cc]/70
`

const textareaClass = `
  mt-4
  w-full
  resize-none
  border-0
  border-b
  border-[#e5d4cc]/20
  bg-transparent
  pb-3
  text-[12px]
  leading-[1.7]
  text-[#e5d4cc]
  placeholder:text-[#e5d4cc]/20
  outline-none
  transition-colors
  duration-300
  focus:border-[#e5d4cc]/70
`

const radioLabelClass = `
  flex
  cursor-pointer
  items-center
  gap-2
  text-[10px]
  text-[#e5d4cc]/50
  transition-colors
  duration-300
  hover:text-[#e5d4cc]
`

const socialLinkClass = `
  text-[10px]
  uppercase
  tracking-[0.15em]
  text-[#e5d4cc]/40
  transition-colors
  duration-300
  hover:text-[#e5d4cc]
`

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  project: "",
  message: "",
  eventType: "",
}

const webProjectTypes = [
  "Business Website",
  "E-commerce Website",
  "Portfolio Website",
  "Web Application",
  "Landing Page",
  "Other",
]

const photographyEventTypes = [
  "Wedding",
  "Engagement",
  "Birthday",
  "Pre-Wedding",
  "Baby Shoot",
  "Portrait",
  "Event",
  "Other",
]

function Contact() {
  const [category, setCategory] = useState("web")

  const [formData, setFormData] = useState(emptyForm)

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const resetForm = () => {
    setFormData(emptyForm)
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))

    setSuccessMessage("")
    setErrorMessage("")
  }

  const handleCategoryChange = (value) => {
    setCategory(value)
    setSuccessMessage("")
    setErrorMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const userToken = localStorage.getItem("userToken")

      const config = userToken
        ? {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        : {}

      if (category === "web") {
        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          project: formData.project.trim(),
          message: formData.message.trim(),
        }

        const response = await api.post(
          "/enquiries",
          payload,
          config
        )

        if (response.data?.success) {
          setSuccessMessage(
            "Thank you. Your enquiry has been submitted successfully."
          )
          resetForm()
        } else {
          setErrorMessage(
            response.data?.message ||
              "Unable to submit your enquiry."
          )
        }
      } else {
        const payload = {
          clientName:
            `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          eventType: formData.eventType.trim(),
          notes: formData.message.trim(),
        }

        const response = await api.post(
          "/bookings",
          payload,
          config
        )

        if (response.data?.success) {
          setSuccessMessage(
            "Thank you. Your photography booking request has been submitted successfully."
          )
          resetForm()
        } else {
          setErrorMessage(
            response.data?.message ||
              "Unable to submit your booking request."
          )
        }
      }
    } catch (error) {
      console.error("Contact form submission error:", error)

      console.error("Backend response:", error.response?.data)

      setErrorMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="contact"
      className="
        relative
        overflow-hidden
        bg-[#050505]
        px-[6%]
        py-[120px]
        text-[#e5d4cc]
        sm:px-[7%]
        lg:py-[160px]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_75%_35%,rgba(95,76,70,0.12),transparent_35%),linear-gradient(120deg,#050505_0%,#080808_55%,#030303_100%)]
        "
      />

      <div className="relative mx-auto max-w-[1350px]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="
            mb-16
            flex
            items-end
            justify-between
            max-md:flex-col
            max-md:items-start
            max-md:gap-6
          "
        >
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#e5d4cc]/35">
              05 / Contact
            </p>

            <p className="mt-4 max-w-[280px] text-[11px] leading-[1.8] text-[#e5d4cc]/45">
              Have a story, project or moment worth turning into a frame?
            </p>
          </div>

          <p
            className="
              max-w-[280px]
              text-right
              text-[9px]
              uppercase
              tracking-[0.2em]
              text-[#e5d4cc]/30
              max-md:text-left
            "
          >
            Available for selected projects & collaborations.
          </p>
        </motion.div>

        <div
          className="
            grid
            grid-cols-1
            gap-16
            lg:grid-cols-[0.85fr_1.4fr]
            lg:gap-24
          "
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="
              flex
              min-h-[520px]
              flex-col
              justify-between
              border
              border-[#e5d4cc]/10
              p-8
              sm:p-10
              lg:p-12
            "
          >
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/35">
                Let's work together
              </p>

              <h2
                className="
                  mt-8
                  max-w-[520px]
                  font-serif
                  text-[65px]
                  font-normal
                  leading-[0.82]
                  tracking-[-4px]
                  text-[#e3cec4]
                  sm:text-[80px]
                  lg:text-[clamp(75px,7vw,120px)]
                "
              >
                Let's
                <br />
                create
                <br />
                something.
              </h2>
            </div>

            <div className="mt-16">
              <div className="mb-7 h-px w-full bg-[#e5d4cc]/10" />

              <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/30">
                Based in
              </p>

              <p className="mt-2 text-[11px] text-[#e5d4cc]/65">
                Kerala, India
              </p>

              <div className="mt-7">
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/30">
                  Email
                </p>

                <a
                  href="mailto:hello@midhunframes.com"
                  className="
                    mt-2
                    inline-block
                    text-[11px]
                    text-[#e5d4cc]/65
                    transition-opacity
                    duration-300
                    hover:opacity-50
                  "
                >
                  hello@midhunframes.com
                </a>
              </div>

              <div className="mt-8 flex gap-6">
                <a href="#instagram" className={socialLinkClass}>
                  Instagram
                </a>

                <a href="#facebook" className={socialLinkClass}>
                  Facebook
                </a>
              </div>
            </div>
          </motion.div>

          <motion.form
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 1,
              delay: 0.15,
              ease: "easeOut",
            }}
            onSubmit={handleSubmit}
            className="flex flex-col justify-center"
          >
            <div className="mb-12">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#e5d4cc]/30">
                Start a conversation
              </p>

              <h3
                className="
                  mt-4
                  font-serif
                  text-[40px]
                  font-normal
                  leading-none
                  tracking-[-2px]
                  text-[#e3cec4]
                  sm:text-[50px]
                "
              >
                Tell me about
                <br />
                your project.
              </h3>
            </div>

            <div className="mb-10">
              <label className={labelClass}>
                What are you looking for?
              </label>

              <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4">
                <label className={radioLabelClass}>
                  <input
                    type="radio"
                    name="category"
                    value="web"
                    checked={category === "web"}
                    onChange={() => handleCategoryChange("web")}
                    className="accent-[#e5d4cc]"
                  />
                  Web Development
                </label>

                <label className={radioLabelClass}>
                  <input
                    type="radio"
                    name="category"
                    value="photography"
                    checked={category === "photography"}
                    onChange={() =>
                      handleCategoryChange("photography")
                    }
                    className="accent-[#e5d4cc]"
                  />
                  Photography & Videography
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <label className={labelClass}>First Name</label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Last Name</label>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {category === "web" && (
              <>
                <div className="mt-10">
                  <label className={labelClass}>Project Type</label>

                  <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4">
                    {webProjectTypes.map((type) => (
                      <label key={type} className={radioLabelClass}>
                        <input
                          type="radio"
                          name="project"
                          value={type}
                          checked={formData.project === type}
                          onChange={handleChange}
                          required
                          className="accent-[#e5d4cc]"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                  <label className={labelClass}>
                    Tell me about your project
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Tell me what you're planning..."
                    className={textareaClass}
                  />
                </div>
              </>
            )}

            {category === "photography" && (
              <>
                <div className="mt-10">
                  <label className={labelClass}>Event Type</label>

                  <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4">
                    {photographyEventTypes.map((type) => (
                      <label key={type} className={radioLabelClass}>
                        <input
                          type="radio"
                          name="eventType"
                          value={type}
                          checked={formData.eventType === type}
                          onChange={handleChange}
                          required
                          className="accent-[#e5d4cc]"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                  <label className={labelClass}>
                    Tell me about your event
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Tell me what you're planning..."
                    className={textareaClass}
                  />
                </div>
              </>
            )}

            {successMessage && (
              <p className="mt-6 text-[9px] uppercase tracking-[0.15em] text-[#e5d4cc]/70">
                {successMessage}
              </p>
            )}

            {errorMessage && (
              <p className="mt-6 text-[9px] uppercase tracking-[0.15em] text-[#e5d4cc]/60">
                {errorMessage}
              </p>
            )}

            <div className="mt-10 flex justify-end">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ x: loading ? 0 : 6 }}
                transition={{ duration: 0.25 }}
                className="
                  group
                  flex
                  items-center
                  gap-5
                  border
                  border-[#e5d4cc]/25
                  px-6
                  py-4
                  text-[9px]
                  uppercase
                  tracking-[0.25em]
                  text-[#e5d4cc]
                  transition-all
                  duration-500
                  hover:border-[#e5d4cc]/70
                  hover:bg-[#e5d4cc]/5
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading
                  ? "Sending..."
                  : category === "web"
                    ? "Send Enquiry"
                    : "Request Booking"}

                {!loading && (
                  <span
                    className="
                      text-sm
                      transition-transform
                      duration-500
                      group-hover:translate-x-2
                    "
                  >
                    →
                  </span>
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="
            mt-[120px]
            flex
            items-center
            justify-between
            border-t
            border-[#e5d4cc]/10
            pt-6
            text-[8px]
            uppercase
            tracking-[0.25em]
            text-[#e5d4cc]/25
            max-md:flex-col
            max-md:gap-4
          "
        >
          <span>Midhun Frames</span>
          <span>Photography · Films · Visual Stories</span>
          <span>05 — Contact</span>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact